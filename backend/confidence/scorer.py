from __future__ import annotations

import re
import time
from datetime import datetime, timezone
from typing import Optional

from models.schemas import ConfidenceReport, RetrievedEntry, RetrievedTheory


class ConfidenceScorer:
    """
    Five-metric system. Overall score gates whether the Oracle gives a confident
    answer (≥0.80) or an honest-uncertainty disclaimer (<0.80).
    """

    WEIGHTS = {
        "personal_evidence": 0.30,
        "theory_alignment": 0.25,
        "cross_consistency": 0.20,
        "temporal_relevance": 0.15,
        "source_citation": 0.10,
    }
    THRESHOLD = 0.80

    def score(
        self,
        retrieved_entries: list[RetrievedEntry],
        retrieved_theories: list[RetrievedTheory],
        generated_answer: Optional[str] = None,
    ) -> ConfidenceReport:
        pes = self._personal_evidence_score(retrieved_entries)
        tas = self._theory_alignment_score(retrieved_theories)
        ccs = self._cross_consistency_score(retrieved_entries, retrieved_theories)
        trs = self._temporal_relevance_score(retrieved_entries)
        scr = self._source_citation_rate(generated_answer, retrieved_entries, retrieved_theories)

        overall = (
            self.WEIGHTS["personal_evidence"] * pes
            + self.WEIGHTS["theory_alignment"] * tas
            + self.WEIGHTS["cross_consistency"] * ccs
            + self.WEIGHTS["temporal_relevance"] * trs
            + self.WEIGHTS["source_citation"] * scr
        )

        return ConfidenceReport(
            personal_evidence_score=round(pes, 3),
            theory_alignment_score=round(tas, 3),
            cross_consistency_score=round(ccs, 3),
            temporal_relevance_score=round(trs, 3),
            source_citation_rate=round(scr, 3),
            overall_confidence=round(overall, 3),
            threshold_met=overall >= self.THRESHOLD,
            entries_used=len(retrieved_entries),
            theories_used=len(retrieved_theories),
            entries_ids=[e.entry_id for e in retrieved_entries],
            theory_ids=[t.chunk_id for t in retrieved_theories],
        )

    # ── Metric 1: Personal Evidence Score (PES) ──────────────────────────────

    def _personal_evidence_score(self, entries: list[RetrievedEntry]) -> float:
        if not entries:
            return 0.0

        # Base: how many entries (saturates at 15)
        count_score = min(len(entries) / 15, 1.0)

        # Similarity quality: avg of top scores
        avg_sim = sum(e.similarity_score for e in entries) / len(entries)

        # Consistency: emotional variance (high agreement = high score)
        emotional_weights = [e.emotional_weight for e in entries]
        if len(emotional_weights) > 1:
            variance = self._variance(emotional_weights)
            consistency = max(0.0, 1.0 - (variance * 2))
        else:
            consistency = 0.5

        # Temporal spread: entries spread over time score higher than clustered
        if len(entries) > 1:
            epochs = [e.created_at.timestamp() for e in entries]
            spread_days = (max(epochs) - min(epochs)) / 86400
            spread_score = min(spread_days / 180, 1.0)
        else:
            spread_score = 0.3

        return 0.35 * count_score + 0.35 * avg_sim + 0.15 * consistency + 0.15 * spread_score

    # ── Metric 2: Theory Alignment Score (TAS) ───────────────────────────────

    def _theory_alignment_score(self, theories: list[RetrievedTheory]) -> float:
        if not theories:
            return 0.0

        count_score = min(len(theories) / 5, 1.0)
        avg_sim = sum(t.similarity_score for t in theories) / len(theories)

        # Diversity: multiple domains boost confidence (breadth of support)
        domains = {t.domain for t in theories}
        diversity_score = min(len(domains) / 3, 1.0)

        return 0.40 * avg_sim + 0.35 * count_score + 0.25 * diversity_score

    # ── Metric 3: Cross-Consistency Score (CCS) ──────────────────────────────

    def _cross_consistency_score(
        self,
        entries: list[RetrievedEntry],
        theories: list[RetrievedTheory],
    ) -> float:
        if not entries and not theories:
            return 0.0
        if not entries or not theories:
            # Only one layer — moderate score, no cross-validation possible
            return 0.55

        # Heuristic: if both layers have high avg similarity to the query,
        # they likely converge on the same topic → high consistency.
        avg_entry_sim = sum(e.similarity_score for e in entries) / len(entries)
        avg_theory_sim = sum(t.similarity_score for t in theories) / len(theories)
        convergence = 1.0 - abs(avg_entry_sim - avg_theory_sim)

        # Bonus if multiple theories agree (inter-theory consistency)
        if len(theories) >= 2:
            theory_sims = [t.similarity_score for t in theories]
            inter_variance = self._variance(theory_sims)
            inter_agreement = max(0.0, 1.0 - inter_variance * 3)
        else:
            inter_agreement = 0.6

        return 0.6 * convergence + 0.4 * inter_agreement

    # ── Metric 4: Temporal Relevance Score (TRS) ─────────────────────────────

    def _temporal_relevance_score(self, entries: list[RetrievedEntry]) -> float:
        if not entries:
            return 0.0

        now = datetime.now(timezone.utc)
        weights = []
        for entry in entries:
            age_days = (now - entry.created_at.replace(tzinfo=timezone.utc)).days
            if age_days <= 30:
                w = 1.0
            elif age_days <= 90:
                w = 0.85
            elif age_days <= 365:
                w = 0.65
            else:
                w = 0.40
            weights.append(w * entry.similarity_score)

        return sum(weights) / len(weights)

    # ── Metric 5: Source Citation Rate (SCR) — anti-hallucination ────────────

    def _source_citation_rate(
        self,
        answer: Optional[str],
        entries: list[RetrievedEntry],
        theories: list[RetrievedTheory],
    ) -> float:
        if not answer:
            return 0.7  # default when no answer yet

        # Count explicit date/source references in the answer
        date_patterns = re.findall(
            r"(wrote on|entry from|you mentioned|in [A-Z][a-z]+ \d{4}|[Yy]ou wrote|"
            r"according to|suggests that|[Ff]rankl|[Kk]ahneman|[Mm]aslow|[Jj]ung|"
            r"[Ss]toic|research|study|theory|based on your)",
            answer,
        )
        citation_density = min(len(date_patterns) / max(len(answer.split(".")) * 0.4, 1), 1.0)

        # Penalise if answer is very long relative to evidence
        evidence_richness = min((len(entries) + len(theories)) / 8, 1.0)

        return 0.6 * citation_density + 0.4 * evidence_richness

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _variance(values: list[float]) -> float:
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        return sum((v - mean) ** 2 for v in values) / len(values)

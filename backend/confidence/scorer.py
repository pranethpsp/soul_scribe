from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Optional

from models.schemas import ConfidenceReport, RetrievedEntry, RetrievedTheory


class ConfidenceScorer:
    """
    Five-metric confidence system.
    THRESHOLD governs whether the Oracle speaks confidently or with caveats.
    Designed to work well for early users (1-10 entries) as well as power users.
    """

    WEIGHTS = {
        "personal_evidence": 0.40,   # raised — personal data is primary signal
        "theory_alignment":  0.15,   # lowered — vault is optional bonus
        "cross_consistency": 0.15,
        "temporal_relevance": 0.20,  # raised — recency matters most for recall
        "source_citation":   0.10,
    }

    # 0.35 means: if we retrieved any reasonably similar entries, answer confidently.
    # The honest-disclaimer path is reserved for truly empty retrieval.
    THRESHOLD = 0.35

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

        # Similarity quality: primary signal — how relevant are the retrieved entries
        top_sim = max(e.similarity_score for e in entries)
        avg_sim = sum(e.similarity_score for e in entries) / len(entries)
        sim_score = 0.6 * top_sim + 0.4 * avg_sim

        # Count score: saturates at 5 (not 15) — early users still get credit
        count_score = min(len(entries) / 5, 1.0)

        # Spread: single entry gets neutral score (not penalised)
        if len(entries) > 1:
            epochs = [e.created_at.timestamp() for e in entries]
            spread_days = (max(epochs) - min(epochs)) / 86400
            spread_score = min(spread_days / 90, 1.0)
        else:
            spread_score = 0.6  # single entry — neutral, not punished

        return 0.55 * sim_score + 0.25 * count_score + 0.20 * spread_score

    # ── Metric 2: Theory Alignment Score (TAS) ───────────────────────────────

    def _theory_alignment_score(self, theories: list[RetrievedTheory]) -> float:
        if not theories:
            return 0.5  # no vault ≠ bad answer; return neutral score

        count_score = min(len(theories) / 4, 1.0)
        avg_sim = sum(t.similarity_score for t in theories) / len(theories)
        domains = {t.domain for t in theories}
        diversity_score = min(len(domains) / 3, 1.0)

        return 0.45 * avg_sim + 0.35 * count_score + 0.20 * diversity_score

    # ── Metric 3: Cross-Consistency Score (CCS) ──────────────────────────────

    def _cross_consistency_score(
        self,
        entries: list[RetrievedEntry],
        theories: list[RetrievedTheory],
    ) -> float:
        if not entries and not theories:
            return 0.0
        if not entries or not theories:
            return 0.65  # one layer only — decent, not disqualifying

        avg_entry_sim = sum(e.similarity_score for e in entries) / len(entries)
        avg_theory_sim = sum(t.similarity_score for t in theories) / len(theories)
        convergence = 1.0 - abs(avg_entry_sim - avg_theory_sim)

        if len(theories) >= 2:
            theory_sims = [t.similarity_score for t in theories]
            inter_variance = self._variance(theory_sims)
            inter_agreement = max(0.0, 1.0 - inter_variance * 3)
        else:
            inter_agreement = 0.7

        return 0.6 * convergence + 0.4 * inter_agreement

    # ── Metric 4: Temporal Relevance Score (TRS) ─────────────────────────────

    def _temporal_relevance_score(self, entries: list[RetrievedEntry]) -> float:
        if not entries:
            return 0.0

        now = datetime.now(timezone.utc)
        weights = []
        for entry in entries:
            created = entry.created_at
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            age_days = (now - created).days
            if age_days <= 1:
                w = 1.0
            elif age_days <= 7:
                w = 0.95
            elif age_days <= 30:
                w = 0.85
            elif age_days <= 90:
                w = 0.70
            elif age_days <= 365:
                w = 0.50
            else:
                w = 0.30
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
            return 0.6

        date_patterns = re.findall(
            r"(wrote on|entry from|you mentioned|you said|in [A-Z][a-z]+ \d{4}|"
            r"[Yy]ou wrote|[Yy]ou went|[Yy]ou did|[Yy]ou felt|"
            r"according to|suggests that|research|theory|based on your)",
            answer,
        )
        citation_density = min(len(date_patterns) / max(len(answer.split(".")) * 0.3, 1), 1.0)
        evidence_richness = min((len(entries) + len(theories)) / 5, 1.0)

        return 0.5 * citation_density + 0.5 * evidence_richness

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _variance(values: list[float]) -> float:
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        return sum((v - mean) ** 2 for v in values) / len(values)

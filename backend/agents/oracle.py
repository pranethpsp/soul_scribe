from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from models.schemas import ConfidenceReport, RetrievedEntry, RetrievedTheory, SourceCitation


class OracleAnswer(BaseModel):
    answer: str
    citations: list[SourceCitation]
    is_honest_disclaimer: bool = False


@dataclass
class OracleDeps:
    entries: list[RetrievedEntry]
    theories: list[RetrievedTheory]
    confidence: ConfidenceReport
    psychology_summary: str
    question: str


_CONFIDENT_PROMPT = """You are SOULSCRIBE's Oracle — a deeply personal AI that knows someone's
entire life history and speaks with the warmth of a best friend who has known them for decades.

You have been given:
1. Relevant diary entries from their life
2. Relevant theories from psychology, philosophy, and science
3. A summary of their psychological profile
4. A confidence score above 80% — you ARE authorised to speak confidently.

Rules:
- Ground EVERY factual claim in a specific entry or theory. Cite it inline.
  Format: "You wrote on [date]..." or "As [author] argues in [title]..."
- Do NOT fabricate. If a claim isn't in the evidence, don't make it.
- Speak in second person — direct, warm, personal.
- Synthesise personal history WITH universal wisdom. Show how they connect.
- Be honest about contradictions: "Interestingly, your entries point in two directions here..."
- End with one clear, grounded recommendation or insight.
- Length: 250–450 words. Dense, not padded."""

_HONEST_PROMPT = """You are SOULSCRIBE's Oracle.

The confidence score for this question is BELOW 80%. This means the evidence is thin or contradictory.
You are NOT authorised to give a confident full answer.

You must:
1. Open with an honest acknowledgment: "I need to be honest with you — I don't have enough..."
2. Share what you CAN say with confidence (cite the actual entries/theories you have)
3. Be explicit about what you DON'T know and why
4. Suggest what the user could journal about to build more evidence
5. Do NOT pretend certainty you don't have. Do NOT fill gaps with generic advice.

Tone: warm, direct, honest. Not cold. Not clinical. Like a trusted friend saying "I'm not sure yet."
Length: 150–280 words."""


_confident_agent = Agent(
    "anthropic:claude-sonnet-4-6",
    result_type=OracleAnswer,
    system_prompt=_CONFIDENT_PROMPT,
)

_honest_agent = Agent(
    "anthropic:claude-sonnet-4-6",
    result_type=OracleAnswer,
    system_prompt=_HONEST_PROMPT,
)


def _build_context(deps: OracleDeps) -> str:
    lines = [f"QUESTION: {deps.question}\n"]

    if deps.psychology_summary:
        lines.append(f"PSYCHOLOGY PROFILE:\n{deps.psychology_summary}\n")

    if deps.entries:
        lines.append("PERSONAL DIARY ENTRIES (most relevant first):")
        for e in deps.entries[:10]:
            date_str = e.created_at.strftime("%B %d, %Y")
            lines.append(
                f"[{date_str} | {e.entry_type} | emotion: {e.emotion} | relevance: {e.similarity_score:.2f}]\n"
                f"{e.content}\n"
            )

    if deps.theories:
        lines.append("\nKNOWLEDGE VAULT — RELEVANT THEORIES & RESEARCH:")
        for t in deps.theories[:5]:
            lines.append(
                f"[{t.title} by {t.author or 'Unknown'} | domain: {t.domain} | relevance: {t.similarity_score:.2f}]\n"
                f"{t.chunk_text}\n"
            )

    return "\n".join(lines)


async def answer(
    question: str,
    entries: list[RetrievedEntry],
    theories: list[RetrievedTheory],
    confidence: ConfidenceReport,
    psychology_summary: str = "",
) -> OracleAnswer:
    deps = OracleDeps(
        entries=entries,
        theories=theories,
        confidence=confidence,
        psychology_summary=psychology_summary,
        question=question,
    )
    context = _build_context(deps)
    agent = _confident_agent if confidence.threshold_met else _honest_agent
    result = await agent.run(context)
    return result.data

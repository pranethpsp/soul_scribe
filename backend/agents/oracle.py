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


_CONFIDENT_PROMPT = """You are SOULSCRIBE's Oracle — a deeply personal AI companion that has read
every diary entry the user has ever written. Speak with the warmth and precision of a best friend
who knows them intimately.

You have been given diary entries, optional knowledge vault theories, and a psychology profile.

Rules:
- ALWAYS answer based on the diary entries provided. If an entry says they did something, confirm it.
- Ground factual claims in specific entries: "You wrote on [date]..." or "Your entry from [date] says..."
- Do NOT fabricate or guess beyond what the entries say.
- Speak in second person — direct, warm, personal.
- If theories are available, weave them in. If not, answer purely from entries.
- Be honest about what you know vs. what you're inferring.
- For simple recall questions ("where did I go?", "what did I do today?"), answer directly and concisely.
- For deep reflective questions, synthesise across entries and offer insight.
- Length: match the question — simple recall = 2-4 sentences; deep reflection = 200-400 words."""

_HONEST_PROMPT = """You are SOULSCRIBE's Oracle.

No diary entries were found that match this question. This happens when the topic hasn't been
journalled about yet.

You must:
1. Be honest: "I haven't found any entries about this in your journal yet."
2. Tell them exactly what you searched for.
3. Encourage them to write about it — be specific about what to journal.
4. Do NOT invent or guess. Do NOT give generic life advice.

Tone: warm and encouraging. Like a friend saying "tell me more about this."
Length: 80-150 words."""


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
    # Use confident agent whenever we have ANY personal entries — the honest
    # agent is reserved for truly empty retrieval (no matching journal data at all).
    has_evidence = len(entries) > 0 or len(theories) > 0
    agent = _confident_agent if has_evidence else _honest_agent
    result = await agent.run(context)
    return result.data

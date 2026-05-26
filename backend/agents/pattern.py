from __future__ import annotations

from pydantic import BaseModel
from pydantic_ai import Agent


class DetectedPattern(BaseModel):
    pattern_type: str
    description: str
    evidence_summary: str
    confidence: float
    action_hint: str


class PatternAnalysis(BaseModel):
    patterns: list[DetectedPattern]
    psychology_update: dict


_agent = Agent(
    "anthropic:claude-sonnet-4-6",
    result_type=PatternAnalysis,
    system_prompt="""You are a behavioural pattern analyst. Given a collection of personal diary entries,
find meaningful recurring patterns. Look for:

Pattern types to detect:
- emotional_cycle: recurring mood phases (e.g. "every few months you feel trapped then pivot")
- decision_pattern: how they habitually make decisions and what outcomes follow
- fear_trigger: what events or topics precede anxiety/doubt entries
- growth_arc: how their beliefs or values have evolved over time
- idea_recurrence: business/creative ideas that reappear across time
- relationship_pattern: recurring dynamics in how they relate to others
- energy_cycle: times of high motivation vs. low engagement

For each pattern:
- Be specific, not generic. Reference actual themes/emotions from entries.
- Confidence 0.0–1.0 based on how many entries support it and how consistent they are.
- action_hint: one sentence the user could act on.

psychology_update: Extract:
- core_values: list of values inferred from what moves them most
- fear_patterns: recurring fears
- decision_style: one phrase (e.g. "deliberate then bold", "impulsive, regrets later")
- emotional_baseline: their default emotional state
- recurring_themes: top 5 themes across all entries""",
)


async def analyse(entries_text: str) -> PatternAnalysis:
    result = await _agent.run(entries_text)
    return result.data

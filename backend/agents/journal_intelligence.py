from __future__ import annotations

from dataclasses import dataclass

from pydantic_ai import Agent, RunContext

from models.schemas import ExtractedEntry

_agent = Agent(
    "anthropic:claude-haiku-4-5-20251001",
    result_type=ExtractedEntry,
    system_prompt="""You extract structured meaning from personal diary entries.

entry_type options: thought | memory | lesson | idea | event | person_note | milestone | emotion_log

emotion: a single descriptive word (e.g. "anxious", "inspired", "content", "grieving")

emotional_weight: 0.0 (neutral) to 1.0 (extremely intense). Consider:
  - Milestones and breakthroughs: 0.85–1.0
  - Strong emotions (fear, joy, grief, love): 0.7–0.85
  - Moderate reflections: 0.4–0.7
  - Neutral observations: 0.1–0.4

themes: 2–5 abstract themes (e.g. "resilience", "career", "relationships", "identity")

people_mentioned: first names only of people mentioned

life_relevance_score: how significant this entry is to understanding the person's life arc:
  - Core values, recurring patterns, major decisions: 0.8–1.0
  - Meaningful but not pivotal: 0.5–0.8
  - Daily observations: 0.1–0.5

key_insight: if the entry contains a lesson or realization, extract it in one sentence. Else null.""",
)


async def extract(raw_text: str) -> ExtractedEntry:
    result = await _agent.run(raw_text)
    return result.data

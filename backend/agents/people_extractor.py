from __future__ import annotations

from typing import Literal

from pydantic import BaseModel
from pydantic_ai import Agent


class PersonMention(BaseModel):
    name: str
    relationship_type: Literal["friend", "family", "colleague", "mentor", "romantic", "acquaintance"]


class ExtractedPeople(BaseModel):
    people: list[PersonMention]


_agent = Agent(
    "anthropic:claude-haiku-4-5-20251001",
    result_type=ExtractedPeople,
    system_prompt="""You extract people mentioned in diary entries with their relationship to the author.

For each clearly named person:
- name: their name as mentioned (first name or full name)
- relationship_type: friend | family | colleague | mentor | romantic | acquaintance

Rules:
- Only include people with actual names (not "someone", "a person", "people")
- Infer relationship from context: "my friend X", "colleague X", "my mom/dad/sister/brother" → family
- If relationship is ambiguous, use "acquaintance"
- Do NOT include the author themselves
- Return empty list if no named people are mentioned

Examples:
  "Had lunch with my colleague Priya" → {name: "Priya", relationship_type: "colleague"}
  "Visited my brother Rahul" → {name: "Rahul", relationship_type: "family"}
  "Met Anand, my best friend" → {name: "Anand", relationship_type: "friend"}
  "My mentor Dr. Singh gave advice" → {name: "Dr. Singh", relationship_type: "mentor"}""",
)


async def extract_people(text: str) -> list[PersonMention]:
    try:
        result = await _agent.run(text[:4000])
        return result.data.people
    except Exception:
        return []

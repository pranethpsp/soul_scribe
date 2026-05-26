from __future__ import annotations

from pydantic import BaseModel
from pydantic_ai import Agent


class PersonBrief(BaseModel):
    name: str
    relationship_summary: str
    key_facts: list[str]
    memorable_moments: list[str]
    upcoming_events: list[str]
    last_mentioned: str
    suggested_topics: list[str]


class RecallSummary(BaseModel):
    title: str
    summary: str
    key_points: list[str]
    time_range: str
    entries_count: int


_brief_agent = Agent(
    "anthropic:claude-haiku-4-5-20251001",
    result_type=PersonBrief,
    system_prompt="""You are a relationship memory curator. Given a person's profile data and
diary entries mentioning them, create a warm, useful brief.

key_facts: important things about them (job, hobbies, values, life situation)
memorable_moments: specific shared or discussed moments worth remembering
upcoming_events: any birthdays or events coming up
last_mentioned: a summary of the most recent diary entry mentioning them
suggested_topics: 3 things the user could bring up next time they meet this person""",
)

_recall_agent = Agent(
    "anthropic:claude-haiku-4-5-20251001",
    result_type=RecallSummary,
    system_prompt="""You are a memory recall assistant. Given diary entries matching a query,
create a clear, honest summary of what the entries say.
- Be faithful to what was actually written
- Do not add interpretation not present in the entries
- Preserve the emotional tone
- Note the time range covered""",
)


async def brief_person(person_data: str, entries_text: str) -> PersonBrief:
    context = f"PERSON DATA:\n{person_data}\n\nDIARY ENTRIES MENTIONING THEM:\n{entries_text}"
    result = await _brief_agent.run(context)
    return result.data


async def recall(query: str, entries_text: str, count: int) -> RecallSummary:
    context = f"QUERY: {query}\n\nMATCHING DIARY ENTRIES ({count} total):\n{entries_text}"
    result = await _recall_agent.run(context)
    data = result.data
    data.entries_count = count
    return data

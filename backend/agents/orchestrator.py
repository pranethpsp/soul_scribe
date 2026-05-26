from __future__ import annotations

import time
import uuid
from dataclasses import dataclass
from typing import Optional

from pydantic import BaseModel
from pydantic_ai import Agent
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from agents import journal_intelligence, oracle, pattern, memory_curator, decision_coach
from agents.pii_guardian import guard
from confidence.scorer import ConfidenceScorer
from db.milvus_client import SoulMilvus
from models.orm import (
    Entry, Person, PsychologyProfile, Conversation, ResponseMetric, Preference
)
from models.schemas import (
    DecisionDomain, EntryCreate, OracleResponse, OracleRequest,
    RetrievedEntry, SourceCitation,
)
from observability.langfuse_setup import trace_llm_call
from observability.otel_setup import get_tracer
from wisdom.retriever import WisdomRetriever, embed


class IntentClassification(BaseModel):
    intent: str  # "journal" | "oracle_question" | "decision" | "recall" | "person_brief"
    domain: Optional[str] = None
    person_name: Optional[str] = None
    is_decision: bool = False


_intent_agent = Agent(
    "anthropic:claude-haiku-4-5-20251001",
    result_type=IntentClassification,
    system_prompt="""Classify user input intent:
- journal: sharing something about their day/life (no question)
- oracle_question: asking a reflective question about themselves or their life
- decision: asking for help with a decision ("should I...", "thinking of...", "considering...")
- recall: asking to retrieve specific past memories ("what did I write about...", "when did I...")
- person_brief: asking about a specific person ("tell me about...", "brief me on...")

For decision, extract domain: career|relationship|money|health|location|creative|general
For person_brief, extract person_name.""",
)

_scorer = ConfidenceScorer()


async def _get_or_create_user(db: AsyncSession, user_id: str = "default"):
    from models.orm import User
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(id=user_id, display_name="You")
        db.add(user)
        await db.commit()
    return user


async def _get_psychology_summary(db: AsyncSession, user_id: str) -> str:
    result = await db.execute(
        select(PsychologyProfile).where(PsychologyProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return ""
    parts = []
    if profile.core_values:
        parts.append(f"Core values: {', '.join(profile.core_values)}")
    if profile.fear_patterns:
        parts.append(f"Fear patterns: {', '.join(profile.fear_patterns)}")
    if profile.decision_style:
        parts.append(f"Decision style: {profile.decision_style}")
    if profile.emotional_baseline:
        parts.append(f"Emotional baseline: {profile.emotional_baseline}")
    if profile.recurring_themes:
        parts.append(f"Recurring themes: {', '.join(profile.recurring_themes)}")
    return " | ".join(parts)


async def handle_journal(
    content: str, user_id: str, db: AsyncSession, milvus: SoulMilvus
) -> dict:
    tracer = get_tracer()
    with tracer.start_as_current_span("orchestrator.journal"):
        # 1. PII guard
        with tracer.start_as_current_span("pii_guardian.scan"):
            pii_result = await guard(content)

        # 2. Extract structure
        with tracer.start_as_current_span("journal_intelligence.extract"):
            extracted = await journal_intelligence.extract(pii_result.cleaned_text)

        # 3. Save to Postgres
        entry = Entry(
            id=str(uuid.uuid4()),
            user_id=user_id,
            raw_content=pii_result.cleaned_text,
            entry_type=extracted.entry_type,
            emotion=extracted.emotion,
            emotional_weight=extracted.emotional_weight,
            themes=extracted.themes,
            people_mentioned=extracted.people_mentioned,
            life_relevance_score=extracted.life_relevance_score,
            key_insight=extracted.key_insight,
            pii_cleared=True,
        )
        db.add(entry)
        await db.flush()

        # 4. Embed and store in Milvus
        with tracer.start_as_current_span("milvus.insert_entry"):
            embedding = await embed(pii_result.cleaned_text)
            vid = milvus.insert_entry(
                entry_id=entry.id,
                user_id=user_id,
                embedding=embedding,
                entry_type=extracted.entry_type,
                emotion=extracted.emotion or "",
                emotional_weight=extracted.emotional_weight,
                created_at_epoch=int(entry.created_at.timestamp()) if entry.created_at else 0,
            )
            entry.milvus_id = vid

        # 5. Update ideas if entry_type == "idea"
        if extracted.entry_type == "idea" and extracted.key_insight:
            await _upsert_idea(db, user_id, extracted.key_insight, entry.id)

        await db.commit()

        return {
            "entry_id": entry.id,
            "entry_type": extracted.entry_type,
            "emotion": extracted.emotion,
            "themes": extracted.themes,
            "key_insight": extracted.key_insight,
            "life_relevance_score": extracted.life_relevance_score,
            "pii_cleared": True,
        }


async def handle_oracle(
    question: str, user_id: str, db: AsyncSession, milvus: SoulMilvus,
    conversation_id: Optional[str] = None,
) -> OracleResponse:
    tracer = get_tracer()
    t0 = time.monotonic()

    with tracer.start_as_current_span("orchestrator.oracle"):
        retriever = WisdomRetriever(milvus, db)

        # Parallel retrieval from both layers
        with tracer.start_as_current_span("milvus.dual_retrieval"):
            entries = await retriever.retrieve_personal(question, user_id, top_k=12)
            theories = await retriever.retrieve_wisdom(question, top_k=6)

        # Score confidence before generating
        confidence = _scorer.score(entries, theories)

        # Get psychology profile
        psych = await _get_psychology_summary(db, user_id)

        # Generate answer
        with tracer.start_as_current_span("oracle.generate"):
            oracle_answer = await oracle.answer(
                question=question,
                entries=entries,
                theories=theories,
                confidence=confidence,
                psychology_summary=psych,
            )

        # Re-score with the actual answer (SCR update)
        confidence = _scorer.score(entries, theories, generated_answer=oracle_answer.answer)

        latency_ms = int((time.monotonic() - t0) * 1000)

        # Persist metric
        metric = ResponseMetric(
            id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            user_id=user_id,
            query=question,
            personal_evidence_score=confidence.personal_evidence_score,
            theory_alignment_score=confidence.theory_alignment_score,
            cross_consistency_score=confidence.cross_consistency_score,
            temporal_relevance_score=confidence.temporal_relevance_score,
            source_citation_rate=confidence.source_citation_rate,
            overall_confidence=confidence.overall_confidence,
            threshold_met=confidence.threshold_met,
            entries_used=confidence.entries_used,
            theories_used=confidence.theories_used,
            entries_ids=confidence.entries_ids,
            theory_ids=confidence.theory_ids,
            response_latency_ms=latency_ms,
        )
        db.add(metric)

        # Trace in Langfuse
        trace_llm_call(
            name="oracle_answer",
            model="claude-sonnet-4-6",
            prompt=question,
            response=oracle_answer.answer,
            metadata={"confidence": confidence.overall_confidence},
            user_id=user_id,
            score=confidence.overall_confidence,
        )

        await db.commit()

    return OracleResponse(
        answer=oracle_answer.answer,
        confidence=confidence,
        citations=oracle_answer.citations,
        is_honest_disclaimer=oracle_answer.is_honest_disclaimer,
    )


async def handle_input(
    text: str, user_id: str, db: AsyncSession, milvus: SoulMilvus,
    conversation_id: Optional[str] = None,
) -> dict:
    await _get_or_create_user(db, user_id)
    intent_result = await _intent_agent.run(text)
    intent = intent_result.data

    if intent.intent == "journal":
        result = await handle_journal(text, user_id, db, milvus)
        return {"type": "journal", **result}

    elif intent.intent in ("oracle_question", "recall"):
        resp = await handle_oracle(text, user_id, db, milvus, conversation_id)
        return {"type": "oracle", "response": resp.model_dump()}

    elif intent.intent == "decision":
        resp = await handle_oracle(text, user_id, db, milvus, conversation_id)
        return {"type": "oracle", "response": resp.model_dump()}

    elif intent.intent == "person_brief":
        if intent.person_name:
            return await handle_person_brief(intent.person_name, user_id, db, milvus)
        resp = await handle_oracle(text, user_id, db, milvus, conversation_id)
        return {"type": "oracle", "response": resp.model_dump()}

    # Default fallback: treat as oracle
    resp = await handle_oracle(text, user_id, db, milvus, conversation_id)
    return {"type": "oracle", "response": resp.model_dump()}


async def handle_person_brief(
    name: str, user_id: str, db: AsyncSession, milvus: SoulMilvus
) -> dict:
    result = await db.execute(
        select(Person).where(
            Person.user_id == user_id,
            Person.name.ilike(f"%{name}%"),
        )
    )
    person = result.scalar_one_or_none()
    person_data = f"Name: {person.name}\nRelationship: {person.relationship_type}\nBirthday: {person.birthday}" if person else f"Name: {name} (not in profile yet)"

    retriever = WisdomRetriever(milvus, db)
    entries = await retriever.retrieve_personal(f"entries mentioning {name}", user_id, top_k=8)
    entries_text = "\n\n".join(
        f"[{e.created_at.strftime('%B %d, %Y')}] {e.content}" for e in entries
    )

    brief = await memory_curator.brief_person(person_data, entries_text)
    return {"type": "person_brief", "brief": brief.model_dump()}


async def run_pattern_analysis(user_id: str, db: AsyncSession) -> None:
    result = await db.execute(
        select(Entry)
        .where(Entry.user_id == user_id, Entry.is_archived == False)
        .order_by(Entry.created_at.desc())
        .limit(100)
    )
    entries = result.scalars().all()
    if len(entries) < 5:
        return

    entries_text = "\n\n".join(
        f"[{e.created_at.strftime('%Y-%m-%d')} | {e.entry_type} | {e.emotion}]\n{e.raw_content}"
        for e in entries
    )

    analysis = await pattern.analyse(entries_text)

    from models.orm import Pattern as PatternORM
    for p in analysis.patterns:
        db.add(PatternORM(
            id=str(uuid.uuid4()),
            user_id=user_id,
            pattern_type=p.pattern_type,
            description=p.description,
            evidence_entries=[],
            confidence=p.confidence,
        ))

    # Update psychology profile
    result2 = await db.execute(
        select(PsychologyProfile).where(PsychologyProfile.user_id == user_id)
    )
    profile = result2.scalar_one_or_none()
    pu = analysis.psychology_update
    if not profile:
        profile = PsychologyProfile(id=str(uuid.uuid4()), user_id=user_id)
        db.add(profile)
    profile.core_values = pu.get("core_values", [])
    profile.fear_patterns = pu.get("fear_patterns", [])
    profile.decision_style = pu.get("decision_style")
    profile.emotional_baseline = pu.get("emotional_baseline")
    profile.recurring_themes = pu.get("recurring_themes", [])

    from datetime import datetime
    profile.last_updated = datetime.utcnow()
    await db.commit()


async def _upsert_idea(db: AsyncSession, user_id: str, title: str, entry_id: str) -> None:
    from models.orm import Idea
    from sqlalchemy import func
    result = await db.execute(
        select(Idea).where(
            Idea.user_id == user_id,
            func.lower(Idea.title).like(f"%{title[:30].lower()}%"),
        )
    )
    idea = result.scalar_one_or_none()
    if idea:
        idea.mention_count += 1
        ids = idea.related_entry_ids or []
        ids.append(entry_id)
        idea.related_entry_ids = ids
    else:
        db.add(Idea(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=title[:200],
            related_entry_ids=[entry_id],
        ))

from __future__ import annotations

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db
from models.orm import Entry, LifeEvent, Pattern, Idea
from models.schemas import InsightItem

router = APIRouter()
DEFAULT_USER = "default"


@router.get("", response_model=list[InsightItem])
async def get_insights(db: AsyncSession = Depends(get_db)):
    insights: list[InsightItem] = []
    today = date.today()

    # 1. Upcoming events in next 14 days
    result = await db.execute(
        select(LifeEvent).where(LifeEvent.user_id == DEFAULT_USER)
    )
    for event in result.scalars().all():
        check = event.event_date
        if event.recurs_yearly:
            try:
                check = event.event_date.replace(year=today.year)
                if check < today:
                    check = event.event_date.replace(year=today.year + 1)
            except ValueError:
                continue
        days_away = (check - today).days
        if 0 <= days_away <= 14:
            insights.append(InsightItem(
                type="upcoming_event",
                title=event.title,
                description=f"Coming up in {days_away} day{'s' if days_away != 1 else ''}",
                metadata={"event_date": str(check), "days_away": days_away},
            ))

    # 2. Latest pattern detected
    result = await db.execute(
        select(Pattern)
        .where(Pattern.user_id == DEFAULT_USER)
        .order_by(desc(Pattern.detected_at))
        .limit(2)
    )
    for p in result.scalars().all():
        insights.append(InsightItem(
            type="pattern",
            title=p.pattern_type.replace("_", " ").title(),
            description=p.description[:200] if p.description else "",
            action_hint=f"Confidence: {int((p.confidence or 0.7) * 100)}%",
        ))

    # 3. Memory anniversary (this week last year)
    one_year_ago = datetime.utcnow() - timedelta(days=365)
    week_start = one_year_ago - timedelta(days=3)
    week_end = one_year_ago + timedelta(days=3)
    result = await db.execute(
        select(Entry).where(
            Entry.user_id == DEFAULT_USER,
            Entry.created_at >= week_start,
            Entry.created_at <= week_end,
            Entry.life_relevance_score >= 0.7,
        ).order_by(desc(Entry.life_relevance_score)).limit(1)
    )
    entry = result.scalar_one_or_none()
    if entry:
        date_str = entry.created_at.strftime("%B %d, %Y") if entry.created_at else "last year"
        insights.append(InsightItem(
            type="memory_anniversary",
            title=f"This week in {entry.created_at.year if entry.created_at else 'the past'}",
            description=entry.raw_content[:150] + "..." if len(entry.raw_content) > 150 else entry.raw_content,
            metadata={"entry_id": entry.id, "original_date": date_str},
        ))

    # 4. Recurring idea (mention_count > 1)
    result = await db.execute(
        select(Idea).where(
            Idea.user_id == DEFAULT_USER,
            Idea.mention_count > 1,
            Idea.status == "raw",
        ).order_by(desc(Idea.mention_count)).limit(1)
    )
    idea = result.scalar_one_or_none()
    if idea:
        insights.append(InsightItem(
            type="recurring_idea",
            title=idea.title[:100],
            description=f"You've mentioned this idea {idea.mention_count} times — it keeps coming back.",
            action_hint="Maybe it's time to develop it further?",
            metadata={"idea_id": idea.id, "mention_count": idea.mention_count},
        ))

    return insights[:8]


@router.get("/patterns", response_model=list[dict])
async def get_patterns(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Pattern)
        .where(Pattern.user_id == DEFAULT_USER)
        .order_by(desc(Pattern.detected_at))
        .limit(20)
    )
    patterns = result.scalars().all()
    return [
        {
            "id": p.id,
            "pattern_type": p.pattern_type,
            "description": p.description,
            "confidence": p.confidence,
            "detected_at": p.detected_at.isoformat() if p.detected_at else None,
        }
        for p in patterns
    ]


@router.get("/psychology")
async def get_psychology_profile(db: AsyncSession = Depends(get_db)):
    from models.orm import PsychologyProfile
    result = await db.execute(
        select(PsychologyProfile).where(PsychologyProfile.user_id == DEFAULT_USER)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return {}
    return {
        "core_values": profile.core_values or [],
        "fear_patterns": profile.fear_patterns or [],
        "decision_style": profile.decision_style,
        "emotional_baseline": profile.emotional_baseline,
        "recurring_themes": profile.recurring_themes or [],
        "last_updated": profile.last_updated.isoformat() if profile.last_updated else None,
    }

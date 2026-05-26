from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agents.orchestrator import handle_person_brief
from db.postgres import get_db
from db.milvus_client import get_milvus, SoulMilvus
from models.orm import Person, LifeEvent
from models.schemas import PersonCreate, PersonOut, LifeEventOut

router = APIRouter()
DEFAULT_USER = "default"


@router.post("", response_model=PersonOut)
async def create_person(body: PersonCreate, db: AsyncSession = Depends(get_db)):
    import uuid
    person = Person(
        id=str(uuid.uuid4()),
        user_id=DEFAULT_USER,
        name=body.name,
        relationship_type=body.relationship_type,
        birthday=body.birthday,
        notes=body.notes,
    )
    db.add(person)

    if body.birthday:
        event = LifeEvent(
            id=str(uuid.uuid4()),
            user_id=DEFAULT_USER,
            title=f"{body.name}'s Birthday",
            event_date=body.birthday,
            recurs_yearly=True,
            person_id=person.id,
            reminder_days_before=7,
        )
        db.add(event)

    await db.commit()
    await db.refresh(person)
    return PersonOut.model_validate(person)


@router.get("", response_model=list[PersonOut])
async def list_people(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Person).where(Person.user_id == DEFAULT_USER).order_by(Person.name)
    )
    return [PersonOut.model_validate(p) for p in result.scalars().all()]


@router.get("/{person_id}/brief")
async def get_brief(
    person_id: str,
    db: AsyncSession = Depends(get_db),
    milvus: SoulMilvus = Depends(get_milvus),
):
    result = await db.execute(select(Person).where(Person.id == person_id))
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(404, "Person not found")
    return await handle_person_brief(person.name, DEFAULT_USER, db, milvus)


@router.get("/upcoming-events", response_model=list[LifeEventOut])
async def upcoming_events(days: int = 30, db: AsyncSession = Depends(get_db)):
    today = date.today()
    cutoff = today + timedelta(days=days)
    result = await db.execute(
        select(LifeEvent).where(LifeEvent.user_id == DEFAULT_USER)
    )
    events = result.scalars().all()

    upcoming = []
    for e in events:
        check_date = e.event_date
        if e.recurs_yearly:
            try:
                check_date = e.event_date.replace(year=today.year)
                if check_date < today:
                    check_date = e.event_date.replace(year=today.year + 1)
            except ValueError:
                continue
        if today <= check_date <= cutoff:
            upcoming.append(LifeEventOut.model_validate(e))

    return sorted(upcoming, key=lambda x: x.event_date)

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from agents.orchestrator import handle_journal
from db.postgres import get_db
from db.milvus_client import get_milvus, SoulMilvus
from models.orm import Entry
from models.schemas import EntryCreate, EntryOut

router = APIRouter()

DEFAULT_USER = "default"


@router.post("", response_model=dict)
async def create_entry(
    body: EntryCreate,
    db: AsyncSession = Depends(get_db),
    milvus: SoulMilvus = Depends(get_milvus),
):
    result = await handle_journal(body.raw_content, DEFAULT_USER, db, milvus)
    return result


@router.get("", response_model=list[EntryOut])
async def list_entries(
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    entry_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Entry).where(
        Entry.user_id == DEFAULT_USER, Entry.is_archived == False
    ).order_by(desc(Entry.created_at)).limit(limit).offset(offset)

    if entry_type:
        q = q.where(Entry.entry_type == entry_type)

    result = await db.execute(q)
    entries = result.scalars().all()
    return [EntryOut.model_validate(e) for e in entries]


@router.get("/{entry_id}", response_model=EntryOut)
async def get_entry(entry_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Entry).where(Entry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(404, "Entry not found")
    return EntryOut.model_validate(entry)


@router.delete("/{entry_id}")
async def delete_entry(
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    milvus: SoulMilvus = Depends(get_milvus),
):
    result = await db.execute(select(Entry).where(Entry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(404, "Entry not found")
    if entry.milvus_id:
        milvus.delete_entry(entry.milvus_id)
    entry.is_archived = True
    await db.commit()
    return {"deleted": entry_id}

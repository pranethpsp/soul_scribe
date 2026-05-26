from __future__ import annotations

import io

import pdfplumber
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agents import knowledge_vault
from auth.deps import get_current_user
from db.postgres import get_db
from db.milvus_client import get_milvus, SoulMilvus
from models.orm import KnowledgeSource, User
from models.schemas import KnowledgeSourceCreate, KnowledgeSourceOut

router = APIRouter()


@router.post("", response_model=KnowledgeSourceOut, status_code=201)
async def upload_to_library(
    title: str = Form(...),
    domain: str = Form(...),
    author: str = Form(""),
    theory_type: str = Form(""),
    summary: str = Form(""),
    text_content: str = Form(""),
    file: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    milvus: SoulMilvus = Depends(get_milvus),
    current_user: User = Depends(get_current_user),
):
    content = text_content
    if file and not content:
        raw = await file.read()
        if file.filename and file.filename.endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(raw)) as pdf:
                content = "\n\n".join(page.extract_text() or "" for page in pdf.pages)
        else:
            content = raw.decode("utf-8", errors="replace")

    if not content.strip():
        raise HTTPException(400, "No text content provided")

    metadata = KnowledgeSourceCreate(
        title=title,
        author=author or None,
        domain=domain,
        theory_type=theory_type or None,
        summary=summary or None,
    )
    source = await knowledge_vault.ingest(content, metadata, db, milvus)
    return KnowledgeSourceOut.model_validate(source)


@router.get("", response_model=list[KnowledgeSourceOut])
async def list_library(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(KnowledgeSource).order_by(KnowledgeSource.added_at.desc())
    )
    return [KnowledgeSourceOut.model_validate(s) for s in result.scalars().all()]


@router.delete("/{source_id}", status_code=204)
async def remove_from_library(
    source_id: str,
    db: AsyncSession = Depends(get_db),
    milvus: SoulMilvus = Depends(get_milvus),
    current_user: User = Depends(get_current_user),
):
    await knowledge_vault.remove(source_id, db, milvus)

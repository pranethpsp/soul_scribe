from __future__ import annotations

import os

import pdfplumber
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agents import knowledge_vault
from agents.orchestrator import run_pattern_analysis
from db.postgres import get_db
from db.milvus_client import get_milvus, SoulMilvus
from models.orm import KnowledgeSource, ResponseMetric
from models.schemas import KnowledgeSourceCreate, KnowledgeSourceOut

router = APIRouter()
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "dev_admin_secret")


def _require_admin(x_admin_secret: str = ""):
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(403, "Admin access required")


@router.post("/vault", response_model=KnowledgeSourceOut)
async def upload_knowledge(
    title: str = Form(...),
    domain: str = Form(...),
    author: str = Form(""),
    theory_type: str = Form(""),
    summary: str = Form(""),
    text_content: str = Form(""),
    file: UploadFile = File(None),
    x_admin_secret: str = Form(""),
    db: AsyncSession = Depends(get_db),
    milvus: SoulMilvus = Depends(get_milvus),
):
    _require_admin(x_admin_secret)

    content = text_content
    if file and not content:
        raw = await file.read()
        if file.filename and file.filename.endswith(".pdf"):
            import io
            with pdfplumber.open(io.BytesIO(raw)) as pdf:
                content = "\n\n".join(
                    page.extract_text() or "" for page in pdf.pages
                )
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


@router.get("/vault", response_model=list[KnowledgeSourceOut])
async def list_vault(
    x_admin_secret: str = "",
    db: AsyncSession = Depends(get_db),
):
    _require_admin(x_admin_secret)
    result = await db.execute(select(KnowledgeSource).order_by(KnowledgeSource.added_at.desc()))
    return [KnowledgeSourceOut.model_validate(s) for s in result.scalars().all()]


@router.delete("/vault/{source_id}")
async def remove_knowledge(
    source_id: str,
    x_admin_secret: str = "",
    db: AsyncSession = Depends(get_db),
    milvus: SoulMilvus = Depends(get_milvus),
):
    _require_admin(x_admin_secret)
    await knowledge_vault.remove(source_id, db, milvus)
    return {"removed": source_id}


@router.post("/analyse-patterns")
async def trigger_pattern_analysis(
    x_admin_secret: str = "",
    db: AsyncSession = Depends(get_db),
):
    _require_admin(x_admin_secret)
    await run_pattern_analysis("default", db)
    return {"status": "pattern analysis complete"}


@router.get("/metrics")
async def get_metrics(
    limit: int = 50,
    x_admin_secret: str = "",
    db: AsyncSession = Depends(get_db),
):
    _require_admin(x_admin_secret)
    result = await db.execute(
        select(ResponseMetric)
        .order_by(ResponseMetric.created_at.desc())
        .limit(limit)
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "query": r.query[:100] if r.query else "",
            "overall_confidence": r.overall_confidence,
            "threshold_met": r.threshold_met,
            "entries_used": r.entries_used,
            "theories_used": r.theories_used,
            "latency_ms": r.response_latency_ms,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]

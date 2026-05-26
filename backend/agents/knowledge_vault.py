from __future__ import annotations

import uuid
from typing import Optional

import tiktoken

from db.milvus_client import SoulMilvus
from models.orm import KnowledgeSource
from models.schemas import KnowledgeSourceCreate
from sqlalchemy.ext.asyncio import AsyncSession
from wisdom.retriever import embed

_enc = tiktoken.get_encoding("cl100k_base")

CHUNK_TOKENS = 400
CHUNK_OVERLAP = 60


def _chunk_text(text: str, max_tokens: int = CHUNK_TOKENS, overlap: int = CHUNK_OVERLAP) -> list[str]:
    tokens = _enc.encode(text)
    chunks = []
    start = 0
    while start < len(tokens):
        end = min(start + max_tokens, len(tokens))
        chunk_tokens = tokens[start:end]
        chunks.append(_enc.decode(chunk_tokens))
        start += max_tokens - overlap
    return [c.strip() for c in chunks if c.strip()]


async def ingest(
    text: str,
    metadata: KnowledgeSourceCreate,
    db: AsyncSession,
    milvus: SoulMilvus,
) -> KnowledgeSource:
    source = KnowledgeSource(
        id=str(uuid.uuid4()),
        title=metadata.title,
        author=metadata.author,
        domain=metadata.domain,
        theory_type=metadata.theory_type,
        summary=metadata.summary,
        chunk_count=0,
        retrieval_count=0,
        is_active=True,
    )
    db.add(source)
    await db.flush()

    chunks = _chunk_text(text)
    for chunk in chunks:
        embedding = await embed(chunk)
        milvus.insert_knowledge_chunk(
            source_id=source.id,
            embedding=embedding,
            title=metadata.title,
            author=metadata.author or "",
            domain=metadata.domain,
            chunk_text=chunk,
        )

    source.chunk_count = len(chunks)
    await db.commit()
    await db.refresh(source)
    return source


async def remove(source_id: str, db: AsyncSession, milvus: SoulMilvus) -> None:
    from sqlalchemy import select
    result = await db.execute(
        select(KnowledgeSource).where(KnowledgeSource.id == source_id)
    )
    src = result.scalar_one_or_none()
    if src:
        milvus.delete_knowledge_source(source_id)
        src.is_active = False
        await db.commit()

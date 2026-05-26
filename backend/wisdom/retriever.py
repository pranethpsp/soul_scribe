from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from typing import Optional

from sentence_transformers import SentenceTransformer

from db.milvus_client import SoulMilvus
from models.orm import Entry, KnowledgeSource
from models.schemas import RetrievedEntry, RetrievedTheory
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

_st_model: Optional[SentenceTransformer] = None


def _get_model() -> SentenceTransformer:
    global _st_model
    if _st_model is None:
        _st_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _st_model


async def embed(text: str) -> list[float]:
    loop = asyncio.get_event_loop()
    vec = await loop.run_in_executor(
        None, lambda: _get_model().encode(text[:8000], normalize_embeddings=True)
    )
    return vec.tolist()


class WisdomRetriever:
    """
    Semantic retrieval from both user_entries (personal memory) and
    knowledge_vault (universal wisdom). Called by Oracle and Decision Coach.
    """

    def __init__(self, milvus: SoulMilvus, db: AsyncSession) -> None:
        self.milvus = milvus
        self.db = db

    async def retrieve_personal(
        self, query: str, user_id: str, top_k: int = 12
    ) -> list[RetrievedEntry]:
        embedding = await embed(query)
        hits = self.milvus.search_entries(user_id, embedding, top_k=top_k)

        if not hits:
            return []

        # Fetch full entry rows from Postgres
        entry_ids = [h["entry_id"] for h in hits]
        score_map = {h["entry_id"]: h["similarity_score"] for h in hits}

        result = await self.db.execute(
            select(Entry).where(Entry.id.in_(entry_ids), Entry.is_archived == False)
        )
        entries = result.scalars().all()

        retrieved = []
        for e in entries:
            retrieved.append(
                RetrievedEntry(
                    entry_id=e.id,
                    content=e.raw_content,
                    entry_type=e.entry_type or "thought",
                    emotion=e.emotion or "",
                    emotional_weight=e.emotional_weight or 0.5,
                    created_at=e.created_at or datetime.now(timezone.utc),
                    similarity_score=score_map.get(e.id, 0.5),
                )
            )

        return sorted(retrieved, key=lambda x: x.similarity_score, reverse=True)

    async def retrieve_wisdom(
        self, query: str, top_k: int = 6
    ) -> list[RetrievedTheory]:
        embedding = await embed(query)
        hits = self.milvus.search_knowledge(embedding, top_k=top_k)

        if not hits:
            return []

        source_ids = list({h["source_id"] for h in hits})
        score_map = {h["chunk_id"]: h["similarity_score"] for h in hits}
        chunk_to_source = {h["chunk_id"]: h["source_id"] for h in hits}

        result = await self.db.execute(
            select(KnowledgeSource).where(
                KnowledgeSource.id.in_(source_ids),
                KnowledgeSource.is_active == True,
            )
        )
        sources = {s.id: s for s in result.scalars().all()}

        retrieved = []
        for h in hits:
            src = sources.get(h["source_id"])
            if not src:
                continue
            retrieved.append(
                RetrievedTheory(
                    chunk_id=h["chunk_id"],
                    source_id=h["source_id"],
                    title=src.title,
                    author=src.author,
                    domain=src.domain or "general",
                    chunk_text=h.get("chunk_text", ""),
                    similarity_score=score_map.get(h["chunk_id"], 0.5),
                )
            )

        # Update retrieval counts
        for src_id in source_ids:
            src = sources.get(src_id)
            if src:
                src.retrieval_count = (src.retrieval_count or 0) + 1

        await self.db.commit()
        return sorted(retrieved, key=lambda x: x.similarity_score, reverse=True)

from __future__ import annotations

import os
from typing import Optional

from pymilvus import (
    Collection,
    CollectionSchema,
    DataType,
    FieldSchema,
    MilvusClient,
    connections,
    utility,
)

MILVUS_HOST = os.getenv("MILVUS_HOST", "localhost")
MILVUS_PORT = int(os.getenv("MILVUS_PORT", "19530"))
EMBEDDING_DIM = 1536

COLLECTIONS = {
    "user_entries": {
        "description": "User diary entry embeddings",
        "fields": [
            FieldSchema("id", DataType.VARCHAR, max_length=64, is_primary=True),
            FieldSchema("entry_id", DataType.VARCHAR, max_length=64),
            FieldSchema("user_id", DataType.VARCHAR, max_length=64),
            FieldSchema("embedding", DataType.FLOAT_VECTOR, dim=EMBEDDING_DIM),
            FieldSchema("entry_type", DataType.VARCHAR, max_length=32),
            FieldSchema("emotion", DataType.VARCHAR, max_length=64),
            FieldSchema("emotional_weight", DataType.FLOAT),
            FieldSchema("created_at_epoch", DataType.INT64),
        ],
    },
    "knowledge_vault": {
        "description": "Developer-curated knowledge: books, theories, research",
        "fields": [
            FieldSchema("id", DataType.VARCHAR, max_length=64, is_primary=True),
            FieldSchema("source_id", DataType.VARCHAR, max_length=64),
            FieldSchema("embedding", DataType.FLOAT_VECTOR, dim=EMBEDDING_DIM),
            FieldSchema("title", DataType.VARCHAR, max_length=300),
            FieldSchema("author", DataType.VARCHAR, max_length=200),
            FieldSchema("domain", DataType.VARCHAR, max_length=64),
            FieldSchema("chunk_text", DataType.VARCHAR, max_length=2000),
        ],
    },
    "person_profiles": {
        "description": "Person profile embeddings for semantic search",
        "fields": [
            FieldSchema("id", DataType.VARCHAR, max_length=64, is_primary=True),
            FieldSchema("person_id", DataType.VARCHAR, max_length=64),
            FieldSchema("user_id", DataType.VARCHAR, max_length=64),
            FieldSchema("embedding", DataType.FLOAT_VECTOR, dim=EMBEDDING_DIM),
            FieldSchema("relationship_type", DataType.VARCHAR, max_length=32),
        ],
    },
}

INDEX_PARAMS = {
    "metric_type": "COSINE",
    "index_type": "IVF_FLAT",
    "params": {"nlist": 128},
}


class SoulMilvus:
    _client: Optional[MilvusClient] = None

    def __init__(self) -> None:
        self._client = MilvusClient(
            uri=f"http://{MILVUS_HOST}:{MILVUS_PORT}"
        )

    @property
    def client(self) -> MilvusClient:
        assert self._client is not None
        return self._client

    def init_collections(self) -> None:
        connections.connect(host=MILVUS_HOST, port=MILVUS_PORT)
        for name, config in COLLECTIONS.items():
            if not utility.has_collection(name):
                fields = config["fields"]
                schema = CollectionSchema(fields, description=config["description"])
                col = Collection(name, schema)
                col.create_index(
                    field_name="embedding",
                    index_params=INDEX_PARAMS,
                )
                col.load()

    def insert_entry(self, entry_id: str, user_id: str, embedding: list[float],
                     entry_type: str, emotion: str, emotional_weight: float,
                     created_at_epoch: int) -> str:
        import uuid
        vid = str(uuid.uuid4()).replace("-", "")[:64]
        self._client.insert(
            collection_name="user_entries",
            data=[{
                "id": vid,
                "entry_id": entry_id,
                "user_id": user_id,
                "embedding": embedding,
                "entry_type": entry_type,
                "emotion": emotion or "",
                "emotional_weight": emotional_weight,
                "created_at_epoch": created_at_epoch,
            }]
        )
        return vid

    def insert_knowledge_chunk(self, source_id: str, embedding: list[float],
                                title: str, author: str, domain: str,
                                chunk_text: str) -> str:
        import uuid
        vid = str(uuid.uuid4()).replace("-", "")[:64]
        self._client.insert(
            collection_name="knowledge_vault",
            data=[{
                "id": vid,
                "source_id": source_id,
                "embedding": embedding,
                "title": title[:300],
                "author": (author or "")[:200],
                "domain": domain[:64],
                "chunk_text": chunk_text[:2000],
            }]
        )
        return vid

    def search_entries(self, user_id: str, embedding: list[float],
                       top_k: int = 10, min_score: float = 0.55) -> list[dict]:
        results = self._client.search(
            collection_name="user_entries",
            data=[embedding],
            filter=f'user_id == "{user_id}"',
            limit=top_k,
            output_fields=["entry_id", "entry_type", "emotion", "emotional_weight", "created_at_epoch"],
            search_params={"metric_type": "COSINE", "params": {"nprobe": 16}},
        )
        hits = []
        for r in results[0]:
            if r["distance"] >= min_score:
                hits.append({**r["entity"], "similarity_score": r["distance"], "milvus_id": r["id"]})
        return hits

    def search_knowledge(self, embedding: list[float], top_k: int = 6,
                          min_score: float = 0.55) -> list[dict]:
        results = self._client.search(
            collection_name="knowledge_vault",
            data=[embedding],
            filter='',
            limit=top_k,
            output_fields=["source_id", "title", "author", "domain", "chunk_text"],
            search_params={"metric_type": "COSINE", "params": {"nprobe": 16}},
        )
        hits = []
        for r in results[0]:
            if r["distance"] >= min_score:
                hits.append({**r["entity"], "similarity_score": r["distance"], "chunk_id": r["id"]})
        return hits

    def delete_entry(self, milvus_id: str) -> None:
        self._client.delete(collection_name="user_entries", ids=[milvus_id])

    def delete_knowledge_source(self, source_id: str) -> None:
        self._client.delete(
            collection_name="knowledge_vault",
            filter=f'source_id == "{source_id}"',
        )


_milvus_instance: Optional[SoulMilvus] = None


def get_milvus() -> SoulMilvus:
    global _milvus_instance
    if _milvus_instance is None:
        _milvus_instance = SoulMilvus()
    return _milvus_instance

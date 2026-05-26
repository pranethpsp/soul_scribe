from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import entries, oracle, people, insights, admin
from db.postgres import init_db, engine
from db.milvus_client import get_milvus
from observability.otel_setup import init_otel


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    milvus = get_milvus()
    try:
        milvus.init_collections()
    except Exception as e:
        print(f"Milvus init warning: {e}")
    yield


app = FastAPI(
    title="SOULSCRIBE API",
    description="Your lifelong intelligent companion",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instrument BEFORE first request — must be called at module level, not inside lifespan
init_otel(app=app, engine=engine)

app.include_router(entries.router, prefix="/api/entries", tags=["entries"])
app.include_router(oracle.router, prefix="/api/oracle", tags=["oracle"])
app.include_router(people.router, prefix="/api/people", tags=["people"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "soulscribe"}

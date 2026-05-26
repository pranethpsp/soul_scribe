from __future__ import annotations

import json
import uuid
from typing import AsyncIterator

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from agents.orchestrator import handle_input, handle_oracle
from db.postgres import get_db
from db.milvus_client import get_milvus, SoulMilvus
from models.schemas import OracleRequest, OracleResponse

router = APIRouter()
DEFAULT_USER = "default"


@router.post("/ask", response_model=OracleResponse)
async def ask_oracle(
    body: OracleRequest,
    db: AsyncSession = Depends(get_db),
    milvus: SoulMilvus = Depends(get_milvus),
):
    response = await handle_oracle(
        question=body.question,
        user_id=DEFAULT_USER,
        db=db,
        milvus=milvus,
        conversation_id=body.conversation_id,
    )
    return response


@router.post("/chat", response_model=dict)
async def chat(
    body: OracleRequest,
    db: AsyncSession = Depends(get_db),
    milvus: SoulMilvus = Depends(get_milvus),
):
    result = await handle_input(
        text=body.question,
        user_id=DEFAULT_USER,
        db=db,
        milvus=milvus,
        conversation_id=body.conversation_id or str(uuid.uuid4()),
    )
    return result


@router.websocket("/ws")
async def oracle_ws(
    websocket: WebSocket,
    db: AsyncSession = Depends(get_db),
    milvus: SoulMilvus = Depends(get_milvus),
):
    await websocket.accept()
    conv_id = str(uuid.uuid4())
    try:
        while True:
            data = await websocket.receive_json()
            text = data.get("text", "")
            if not text:
                continue

            await websocket.send_json({"type": "thinking"})

            try:
                result = await handle_input(
                    text=text,
                    user_id=DEFAULT_USER,
                    db=db,
                    milvus=milvus,
                    conversation_id=conv_id,
                )
                await websocket.send_json({"type": "result", "data": result})
            except Exception as e:
                await websocket.send_json({"type": "error", "message": str(e)})

    except WebSocketDisconnect:
        pass

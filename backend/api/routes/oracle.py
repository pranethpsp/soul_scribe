from __future__ import annotations

import json
import uuid
from typing import AsyncIterator

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from agents.orchestrator import handle_input, handle_oracle
from auth.deps import get_current_user
from db.postgres import get_db
from db.milvus_client import get_milvus, SoulMilvus
from models.orm import User
from models.schemas import OracleRequest, OracleResponse

router = APIRouter()


@router.post("/ask", response_model=OracleResponse)
async def ask_oracle(
    body: OracleRequest,
    db: AsyncSession = Depends(get_db),
    milvus: SoulMilvus = Depends(get_milvus),
    current_user: User = Depends(get_current_user),
):
    response = await handle_oracle(
        question=body.question,
        user_id=current_user.id,
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
    current_user: User = Depends(get_current_user),
):
    result = await handle_input(
        text=body.question,
        user_id=current_user.id,
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
    # WebSocket authentication: expect token as query param ?token=<jwt>
    from jose import JWTError
    from sqlalchemy import select
    from auth.jwt import decode_token
    from models.orm import User as UserModel

    token = websocket.query_params.get("token")
    user = None
    if token:
        try:
            payload = decode_token(token)
            user_id = payload.get("sub")
            if user_id:
                result = await db.execute(select(UserModel).where(UserModel.id == user_id))
                user = result.scalar_one_or_none()
        except JWTError:
            pass

    if user is None:
        await websocket.close(code=4001)
        return

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
                    user_id=user.id,
                    db=db,
                    milvus=milvus,
                    conversation_id=conv_id,
                )
                await websocket.send_json({"type": "result", "data": result})
            except Exception as e:
                await websocket.send_json({"type": "error", "message": str(e)})

    except WebSocketDisconnect:
        pass

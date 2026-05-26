from __future__ import annotations

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import get_current_user
from auth.jwt import create_token, hash_password, verify_password
from db.postgres import get_db
from models.orm import User

router = APIRouter()

USERNAME_RE = re.compile(r'^[a-zA-Z0-9_]{3,30}$')


class RegisterRequest(BaseModel):
    username: str
    password: str
    display_name: str = ""

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not USERNAME_RE.match(v):
            raise ValueError('Username must be 3-30 characters: letters, numbers, underscores only')
        return v.lower()

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v


class LoginRequest(BaseModel):
    username: str
    password: str

    @field_validator('username')
    @classmethod
    def normalise_username(cls, v: str) -> str:
        return v.lower()


class AuthUserOut(BaseModel):
    id: str
    username: str
    display_name: str | None
    created_at: str | None = None


class AuthResponse(BaseModel):
    token: str
    user: AuthUserOut


def _user_out(user: User) -> AuthUserOut:
    return AuthUserOut(
        id=user.id,
        username=user.username,
        display_name=user.display_name or user.username,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose another.",
        )
    user = User(
        id=str(uuid.uuid4()),
        username=body.username,
        hashed_password=hash_password(body.password),
        display_name=body.display_name or body.username,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_token(user.id, user.username)
    return AuthResponse(token=token, user=_user_out(user))


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_token(user.id, user.username)
    return AuthResponse(token=token, user=_user_out(user))


@router.get("/me", response_model=AuthUserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return _user_out(current_user)

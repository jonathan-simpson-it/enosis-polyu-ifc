"""Authentication endpoints: register, login, API key management."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.database import get_db
from backend.src.core.models.auth import Organization, User
from backend.src.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_api_key,
    get_current_user,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


# ── Schemas ──


class RegisterRequest(BaseModel):
    email: str
    password: str
    org_name: str = ""
    full_name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    org_id: str | None = None


class APIKeyResponse(BaseModel):
    api_key: str


# ── Routes ──


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    org_id = None
    if req.org_name:
        org = Organization(id=uuid.uuid4(), name=req.org_name)
        db.add(org)
        await db.flush()
        org_id = org.id

    user = User(
        id=uuid.uuid4(),
        org_id=org_id,
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role="admin" if org_id else "member",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        org_id=str(org_id) if org_id else None,
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        org_id=str(user.org_id) if user.org_id else None,
    )


@router.post("/api-key", response_model=APIKeyResponse)
async def regenerate_api_key(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.api_key = generate_api_key()
    await db.commit()
    return APIKeyResponse(api_key=current_user.api_key)


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "org_id": str(current_user.org_id) if current_user.org_id else None,
        "api_key": current_user.api_key,
    }

"""Organization management endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.database import get_db
from backend.src.core.models.auth import Organization, User
from backend.src.core.security import get_current_user

router = APIRouter(prefix="/api/v1/orgs", tags=["Organizations"])


class OrgResponse(BaseModel):
    id: str
    name: str
    br_number: str | None
    subscription_tier: str
    usage_limit: int
    usage_current: int


class OrgUpdateRequest(BaseModel):
    name: str | None = None
    br_number: str | None = None


@router.get("/{org_id}", response_model=OrgResponse)
async def get_org(
    org_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.org_id and str(current_user.org_id) != org_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if not current_user.org_id:
        raise HTTPException(status_code=404, detail="No organization")

    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return OrgResponse(
        id=str(org.id),
        name=org.name,
        br_number=org.br_number,
        subscription_tier=org.subscription_tier,
        usage_limit=org.usage_limit,
        usage_current=org.usage_current,
    )


@router.put("/{org_id}", response_model=OrgResponse)
async def update_org(
    org_id: str,
    req: OrgUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.org_id and str(current_user.org_id) != org_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if not current_user.org_id:
        raise HTTPException(status_code=404, detail="No organization")

    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if req.name is not None:
        org.name = req.name
    if req.br_number is not None:
        org.br_number = req.br_number

    await db.commit()
    await db.refresh(org)

    return OrgResponse(
        id=str(org.id),
        name=org.name,
        br_number=org.br_number,
        subscription_tier=org.subscription_tier,
        usage_limit=org.usage_limit,
        usage_current=org.usage_current,
    )

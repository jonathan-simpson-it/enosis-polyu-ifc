"""Research contributions status endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from backend.src.research.docformer_trade import DocFormerTradeModel
from backend.src.research.hierarchical_hs import HierarchicalHS
from backend.src.research.uncertainty_guard import UncertaintyGuard
from backend.src.research.meta_schema import MetaSchema
from backend.src.research.trade_bench import TradeBench

router = APIRouter(prefix="/api/v1/research", tags=["Research"])

_CONTRIBUTIONS = [
    DocFormerTradeModel.get_metadata(),
    HierarchicalHS.get_metadata(),
    UncertaintyGuard.get_metadata(),
    MetaSchema.get_metadata(),
    TradeBench.get_metadata(),
]


@router.get("")
async def list_research_contributions():
    """List all five novel research contributions with status."""
    return {
        "platform": "Enosis UDIE Research Platform",
        "total_contributions": len(_CONTRIBUTIONS),
        "contributions": _CONTRIBUTIONS,
        "status": "Research stubs — ready for development and publication",
    }


@router.get("/{name}")
async def get_research_contribution(name: str):
    """Get details for a specific research contribution."""
    for c in _CONTRIBUTIONS:
        if c["name"].lower() == name.lower():
            return c
    return {"error": f"Unknown contribution: {name}", "available": [c["name"] for c in _CONTRIBUTIONS]}

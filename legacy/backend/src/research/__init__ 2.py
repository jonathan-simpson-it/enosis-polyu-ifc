"""Enosis UDIE — Novel Research Contributions.

This package contains stub implementations of five novel research contributions
that power the Enosis UDIE platform. These are architectural blueprints for
future research publications.

Contributions:
1. DocFormer-Trade — Multi-modal transformer for regulatory documents
2. HierarchicalHS — Contrastive learning for HS code classification
3. UncertaintyGuard — Conformal prediction for high-stakes data
4. MetaSchema — Meta-learning for zero-shot cross-vertical transfer
5. TradeBench — Open-source benchmark for regulatory document understanding
"""

from backend.src.research.docformer_trade import DocFormerTradeConfig, DocFormerTradeModel
from backend.src.research.hierarchical_hs import HierarchicalHSConfig, HierarchicalHS
from backend.src.research.uncertainty_guard import UncertaintyGuard
from backend.src.research.meta_schema import MetaSchema
from backend.src.research.trade_bench import TradeBenchConfig, TradeBench

__all__ = [
    "DocFormerTradeConfig",
    "DocFormerTradeModel",
    "HierarchicalHSConfig",
    "HierarchicalHS",
    "UncertaintyGuard",
    "MetaSchema",
    "TradeBenchConfig",
    "TradeBench",
]

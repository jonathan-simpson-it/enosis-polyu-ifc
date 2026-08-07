"""pgvector embedding generation and similarity search for HS codes."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.core.models.trade import HSCode
from backend.src.utils.logger import logger

_embedder = None


def _get_embedder():
    global _embedder
    if _embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedder = SentenceTransformer("all-MiniLM-L6-v2")
        except ImportError:
            logger.warning("sentence-transformers not available, using fallback")
            _embedder = None
    return _embedder


def generate_embedding(text: str) -> list[float] | None:
    model = _get_embedder()
    if model is None:
        return None
    try:
        embedding = model.encode(text).tolist()
        return embedding
    except Exception as exc:
        logger.warning(f"Embedding generation failed: {exc}")
        return None


async def seed_hs_code_embeddings(db: AsyncSession):
    result = await db.execute(select(HSCode).where(HSCode.embedding.is_(None)))
    codes = result.scalars().all()

    for code in codes:
        text = f"{code.code} {code.description}"
        embedding = generate_embedding(text)
        if embedding:
            code.embedding = embedding

    await db.commit()
    logger.info(f"Generated embeddings for {len(codes)} HS codes")


async def search_similar_hs_codes(
    query: str,
    db: AsyncSession,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    query_embedding = generate_embedding(query)
    if query_embedding is None:
        return []

    embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    result = await db.execute(
        select(
            HSCode.code,
            HSCode.description,
            HSCode.chapter,
            HSCode.heading,
            (HSCode.embedding.cosine_distance(embedding_str)).label("distance"),
        )
        .order_by(text("distance ASC"))
        .limit(top_k)
    )

    rows = result.all()
    return [
        {
            "code": row.code,
            "description": row.description,
            "chapter": row.chapter,
            "distance": round(float(row.distance), 4),
        }
        for row in rows
    ]

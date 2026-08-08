"""Pluggable schema registry — map each schema type to its builder."""

from __future__ import annotations

from typing import Any, Callable


class SchemaRegistry:
    def __init__(self):
        self._builders: dict[str, Callable[..., dict[str, Any]]] = {}

    def register(self, name: str, builder: Callable[..., dict[str, Any]]):
        self._builders[name] = builder

    def get(self, name: str) -> Callable[..., dict[str, Any]]:
        builder = self._builders.get(name)
        if not builder:
            raise ValueError(f"Unknown schema: {name}. Available: {list(self._builders.keys())}")
        return builder

    def list(self) -> list[str]:
        return list(self._builders.keys())


registry = SchemaRegistry()

#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "╔══════════════════════════════════════════════════╗"
echo "║     ENOSIS v0 — Docker Quick Start              ║"
echo "╚══════════════════════════════════════════════════╝"

command -v docker >/dev/null 2>&1 || { echo "✗ docker not found"; exit 1; }

if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ Created .env from .env.example"
  echo "  Edit .env and add your DEEPSEEK_API_KEY, then re-run"
  exit 0
fi

echo "→ Building and starting..."
docker compose up --build -d

echo "→ Waiting for API..."
sleep 5

echo "→ Seeding database..."
docker compose exec api python scripts/seed_database.py

echo "→ Running demo..."
docker compose exec api python scripts/run_demo.py

echo ""
echo "→ Services:"
echo "  API: http://localhost:8000"
echo "  Docs: http://localhost:8000/docs"
echo "  CMS:  http://localhost:8080"
echo ""
echo "→ Stop with: docker compose down"

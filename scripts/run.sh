#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "╔══════════════════════════════════════════════════╗"
echo "║         ENOSIS v0 — Quick Start                 ║"
echo "╚══════════════════════════════════════════════════╝"

# ── Check prerequisites ──
command -v python3 >/dev/null 2>&1 || { echo "✗ python3 not found"; exit 1; }

if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ Created .env from .env.example"
  echo "  Edit .env and add your DEEPSEEK_API_KEY, then re-run"
  exit 0
fi

# ── Install deps if needed ──
if [ ! -d .venv ]; then
  echo "→ Creating virtual environment..."
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -q -r requirements.txt
  playwright install chromium
else
  source .venv/bin/activate
fi

# ── Start mock CMS ──
echo "→ Starting mock CMS on :8080..."
python3 -m http.server 8080 --directory mock_cms > /tmp/enosis-cms.log 2>&1 &
CMS_PID=$!
echo "  PID: $CMS_PID"

# ── Start API server ──
echo "→ Starting API server on :8000..."
python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 > /tmp/enosis-api.log 2>&1 &
API_PID=$!
echo "  PID: $API_PID"

sleep 3

# Check if started
if ! kill -0 $API_PID 2>/dev/null; then
  echo "✗ API failed to start. Check /tmp/enosis-api.log"
  exit 1
fi

echo "→ API: http://localhost:8000"
echo "→ Docs: http://localhost:8000/docs"
echo "→ CMS:  http://localhost:8080"

# ── Seed database ──
python scripts/seed_database.py

# ── Run demo ──
python scripts/run_demo.py

# ── Cleanup ──
echo ""
echo "→ Servers still running. Stop them with:"
echo "  kill $API_PID $CMS_PID"

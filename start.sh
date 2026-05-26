#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ◆ SOULSCRIBE — Starting up"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check .env exists
if [ ! -f .env ]; then
  echo "⚠  No .env found. Copying from .env.example..."
  cp .env.example .env
  echo "   Edit .env and add your API keys, then re-run."
  exit 1
fi

echo "▶  Starting Docker services..."
docker compose up -d

echo ""
echo "⏳  Waiting for Postgres to be ready..."
until docker compose exec -T postgres pg_isready -U soul -d soulscribe &>/dev/null; do
  sleep 2
done

echo "▶  Running database migrations..."
docker compose exec backend python -m alembic upgrade head

echo "▶  Initialising Milvus collections..."
docker compose exec backend python -c "from db.milvus_client import get_milvus; m = get_milvus(); m.init_collections(); print('Milvus ready')"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓  SOULSCRIBE is running"
echo ""
echo "  App:       http://localhost:5173"
echo "  API docs:  http://localhost:8000/docs"
echo "  Langfuse:  http://localhost:3001"
echo "  Jaeger:    http://localhost:16686"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

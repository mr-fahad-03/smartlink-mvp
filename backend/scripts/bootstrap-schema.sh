#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_FILE="$ROOT_DIR/sql/supabase_schema.sql"

if [[ ! -f "$SCHEMA_FILE" ]]; then
  echo "Schema file not found: $SCHEMA_FILE" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required. Install it or run the SQL manually in Supabase SQL Editor:" >&2
  echo "  $SCHEMA_FILE" >&2
  exit 1
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is not set." >&2
  echo "Get it from Supabase: Project Settings -> Database -> Connection string (URI)" >&2
  echo "Then run:" >&2
  echo "  SUPABASE_DB_URL='postgresql://...'
  npm run db:bootstrap" >&2
  exit 1
fi

echo "Applying schema: $SCHEMA_FILE"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE"
echo "Schema bootstrap completed."

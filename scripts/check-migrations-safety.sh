#!/usr/bin/env bash
# Fails CI when *new/changed* migrations contain destructive DDL unless explicitly allowed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIG_DIR="$ROOT/supabase/migrations"

if [[ ! -d "$MIG_DIR" ]]; then
  echo "No migrations directory at $MIG_DIR"
  exit 0
fi

if [[ "${ALLOW_DESTRUCTIVE_MIGRATION:-}" == "1" ]]; then
  echo "ALLOW_DESTRUCTIVE_MIGRATION=1 — skipping destructive migration scan."
  exit 0
fi

# High-risk patterns only (routine DROP POLICY / INDEX / TRIGGER are allowed).
PATTERN='DROP[[:space:]]+(TABLE|COLUMN|SCHEMA)[[:space:]]|ALTER[[:space:]]+TABLE[^;]*DROP[[:space:]]+COLUMN|TRUNCATE[[:space:]]+TABLE'

collect_changed_migrations() {
  if ! git -C "$ROOT" rev-parse --is-inside-work-tree &>/dev/null; then
    return 1
  fi
  local base="${GITHUB_BASE_REF:-main}"
  base="${base#refs/heads/}"
  local merge_base
  merge_base="$(git -C "$ROOT" merge-base "origin/${base}" HEAD 2>/dev/null || git -C "$ROOT" merge-base "${base}" HEAD 2>/dev/null || true)"
  if [[ -z "$merge_base" ]]; then
    git -C "$ROOT" diff --name-only HEAD~1 -- "$MIG_DIR"/*.sql 2>/dev/null || true
    return 0
  fi
  git -C "$ROOT" diff --name-only "$merge_base"...HEAD -- "$MIG_DIR"/*.sql 2>/dev/null || true
}

mapfile -t FILES < <(collect_changed_migrations | sort -u | grep -E '\.sql$' || true)

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No changed migration files detected — destructive DDL scan skipped."
  exit 0
fi

FOUND=0
for f in "${FILES[@]}"; do
  [[ -f "$f" ]] || continue
  if grep -Ein "$PATTERN" "$f" >/dev/null 2>&1; then
    echo "::error file=$f::Destructive SQL in changed migration (DROP TABLE/COLUMN, TRUNCATE). Set ALLOW_DESTRUCTIVE_MIGRATION=1 only after manual review."
    grep -Ein "$PATTERN" "$f" || true
    FOUND=1
  fi
done

if [[ "$FOUND" -ne 0 ]]; then
  exit 1
fi

echo "Migration safety check passed (${#FILES[@]} changed file(s))."

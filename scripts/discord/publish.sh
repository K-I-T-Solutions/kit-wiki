#!/usr/bin/env bash
set -euo pipefail
ENGINE="${1:-node}"
OUT_DIR="out"
JSON_DST="src/data/discord/discord_export.json"
MD_DST="docs/discord_report.md"
mkdir -p "$OUT_DIR" "$(dirname "$JSON_DST")" "$(dirname "$MD_DST")"
# env laden
if [ -f ".env" ]; then export $(grep -v '^#' .env | xargs); fi

if [ "${ENGINE}" = "py" ]; then
  if [ ! -d ".venv" ]; then python -m venv .venv; . .venv/bin/activate; pip install -U "discord.py>=2.4"; else . .venv/bin/activate; fi
  python scripts/discord/discord_export.py
else
  if [ ! -d "node_modules" ]; then npm i discord.js@^14; fi
  node scripts/discord/discord_export.mjs
fi

mv "${OUT_DIR}/discord_export.json" "${JSON_DST}"
mv "${OUT_DIR}/discord_report.md"   "${MD_DST}"
echo "✅ Publish fertig:"
echo " - ${JSON_DST}"
echo " - ${MD_DST}"

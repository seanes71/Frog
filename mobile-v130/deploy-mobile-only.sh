#!/usr/bin/env bash
# R15 same-origin mobile rollout. Deploys ONLY the Froggy Faceoff mobile Hosting site.
# The website and the other Firebase Hosting sites are not targets.
set -Eeuo pipefail

PROJECT="frog-match"
SITE="froggy-faceoff-mobile"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
R15_EXPORT_DIR="${R15_EXPORT_DIR:-}"
GAME_TARGET="$REPO_DIR/dist/froggy-match-frenzy"
BACKUP_ROOT="${HOME}/froggy-r15-backups"

printf '\nFroggy Faceoff Mobile — R15 integration\n'
[ -n "$R15_EXPORT_DIR" ] || { echo "Set R15_EXPORT_DIR to the R15 Godot Web export folder (the folder containing index.html, index.js, index.wasm and index.pck)."; exit 1; }
[ -d "$R15_EXPORT_DIR" ] || { echo "R15 export folder not found: $R15_EXPORT_DIR"; exit 1; }
for file in index.html index.js index.wasm index.pck; do
  [ -f "$R15_EXPORT_DIR/$file" ] || { echo "R15 export is incomplete: missing $file"; exit 1; }
done
[ -f "$REPO_DIR/dist/index.html" ] || { echo "Froggy Faceoff mobile lobby not found."; exit 1; }
[ -f "$REPO_DIR/dist/mobile.html" ] || { echo "Mobile return page is missing."; exit 1; }
[ -f "$REPO_DIR/dist/app.js" ] || { echo "Mobile lobby app.js is missing."; exit 1; }
grep -q "froggy-match-frenzy/" "$REPO_DIR/dist/app.js" || { echo "The R15 same-origin launcher is missing."; exit 1; }
if grep -q "froggy-match-frenzy-mobile.web.app" "$REPO_DIR/dist/app.js"; then
  echo "The old separate-site launcher is still present; stopping."
  exit 1
fi
command -v firebase >/dev/null || { echo "Firebase CLI is not available."; exit 1; }
command -v python3 >/dev/null || { echo "Python 3 is required for the safe HTML patch."; exit 1; }

mkdir -p "$BACKUP_ROOT"
if [ -d "$GAME_TARGET" ]; then
  BACKUP="$BACKUP_ROOT/froggy-match-frenzy-$(date +%Y%m%d-%H%M%S)"
  mv "$GAME_TARGET" "$BACKUP"
  echo "Preserved previous mobile game folder at: $BACKUP"
fi

mkdir -p "$GAME_TARGET"
cp -a "$R15_EXPORT_DIR"/. "$GAME_TARGET"/
cp "$SCRIPT_DIR/froggy-faceoff-bridge.js" "$GAME_TARGET/froggy-faceoff-bridge.js"

python3 - "$GAME_TARGET/index.html" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
html = p.read_text(encoding="utf-8")
snippet = '<script defer src="froggy-faceoff-bridge.js?v=r15"></script>'
if snippet not in html:
    if "</body>" not in html:
        raise SystemExit("R15 export has no closing body tag; stopping.")
    html = html.replace("</body>", "  " + snippet + "\n</body>", 1)
p.write_text(html, encoding="utf-8")
print("Added the Faceoff return control.")
PY

cat > "$REPO_DIR/firebase.r15.mobile.json" <<JSON
{
  "hosting": {
    "site": "$SITE",
    "public": "dist",
    "ignore": ["firebase.json", "firebase.*.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {"source": "**/*.html", "headers": [{"key": "Cache-Control", "value": "no-cache"}]},
      {"source": "**/*.js", "headers": [{"key": "Cache-Control", "value": "no-cache"}]},
      {"source": "**/*.wasm", "headers": [{"key": "Cache-Control", "value": "no-cache"}]},
      {"source": "**/*.pck", "headers": [{"key": "Cache-Control", "value": "no-cache"}]},
      {"source": "**/*.webmanifest", "headers": [{"key": "Cache-Control", "value": "no-cache"}]}
    ]
  }
}
JSON

if ! firebase hosting:sites:list --project "$PROJECT" | grep -Fq "$SITE"; then
  echo "Expected existing Hosting site $SITE was not found. No deployment performed."
  exit 1
fi

printf '\nDeployment target: https://%s.web.app\n' "$SITE"
printf 'New game path:      https://%s.web.app/froggy-match-frenzy/?from=faceoff\n' "$SITE"
printf 'Firebase project:   %s\n' "$PROJECT"
printf 'Only this mobile Hosting site will be deployed.\n'
printf 'The old standalone Vegas site remains untouched as a rollback.\n'
read -r -p 'Publish the R15 mobile replacement? Type YES to continue: ' confirm
[ "$confirm" = "YES" ] || { echo "No deployment performed."; exit 0; }

cd "$REPO_DIR"
firebase deploy --config firebase.r15.mobile.json --only hosting --project "$PROJECT"
printf '\nR15 mobile replacement deployed.\n'

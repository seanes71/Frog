#!/usr/bin/env bash
# Froggy Faceoff V122 mobile-only deployment. No GitHub main or website changes.
set -Eeuo pipefail

PROJECT="frog-match"
LOBBY_SITE="froggy-faceoff-mobile"
VEGAS_SITE="froggy-match-frenzy-mobile"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VEGAS_DIR="${HOME}/froggy-mobile"

printf '\nFroggy V122: mobile-only rollout\n'
command -v firebase >/dev/null || { echo "Firebase CLI is not available."; exit 1; }
[ -f "$REPO_DIR/dist/index.html" ] || { echo "Mobile lobby files not found."; exit 1; }
[ -f "$REPO_DIR/dist/app.js" ] || { echo "Mobile lobby app.js not found."; exit 1; }
[ -f "$VEGAS_DIR/public/index.html" ] || { echo "Vegas V121 files not found at $VEGAS_DIR."; exit 1; }
[ -f "$VEGAS_DIR/public/index.pck" ] || { echo "Vegas game data missing."; exit 1; }
[ -f "$VEGAS_DIR/public/index.wasm" ] || { echo "Vegas engine missing."; exit 1; }
grep -q 'froggy-match-frenzy-mobile.web.app/?from=faceoff' "$REPO_DIR/dist/app.js" || { echo "The V122 launcher is missing."; exit 1; }

python3 - "$VEGAS_DIR/firebase.json" "$VEGAS_SITE" <<'PY'
import json,sys
with open(sys.argv[1],encoding='utf-8') as f: data=json.load(f)
h=data['hosting']
assert isinstance(h,dict) and h.get('site')==sys.argv[2], 'Wrong Vegas Hosting target'
print('Checked Vegas target:',h['site'])
PY

if firebase hosting:sites:list --project "$PROJECT" | grep -Eq "(^|[[:space:]|])${LOBBY_SITE}([[:space:]|]|$)"; then
  echo "Mobile Faceoff site already exists."
else
  echo "Creating separate mobile Faceoff site..."
  firebase hosting:sites:create "$LOBBY_SITE" --project "$PROJECT"
fi

cat > "$REPO_DIR/firebase.v122.mobile.json" <<JSON
{
  "hosting": {
    "site": "$LOBBY_SITE",
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {"source":"**/*.html","headers":[{"key":"Cache-Control","value":"no-cache"}]},
      {"source":"**/*.js","headers":[{"key":"Cache-Control","value":"no-cache"}]}
    ]
  }
}
JSON

cp -n "$VEGAS_DIR/public/index.html" "$VEGAS_DIR/public/index.html.v121.pre-v122-backup" || true
cp "$SCRIPT_DIR/froggy-faceoff-bridge.js" "$VEGAS_DIR/public/froggy-faceoff-bridge.js"
python3 - "$VEGAS_DIR/public/index.html" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); text=p.read_text(encoding='utf-8')
snippet='<script defer src="froggy-faceoff-bridge.js?v=122"></script>'
if snippet not in text:
    if '</body>' not in text: raise SystemExit('Closing body not found; stopping.')
    p.write_text(text.replace('</body>', '  '+snippet+'\n</body>',1),encoding='utf-8')
print('Verified Vegas return control script.')
PY

printf '\nDeployment targets — original frog-match website NOT included:\n'
printf '1) %s.web.app — Froggy Faceoff Mobile lobby\n' "$LOBBY_SITE"
printf '2) %s.web.app — Vegas Championship\n\n' "$VEGAS_SITE"
read -r -p 'Publish these two mobile sites? Type YES to continue: ' confirm
[ "$confirm" = "YES" ] || { echo 'No deployment performed.'; exit 0; }

cd "$REPO_DIR"
firebase deploy --config firebase.v122.mobile.json --only hosting --project "$PROJECT"
cd "$VEGAS_DIR"
firebase deploy --only hosting --project "$PROJECT"

printf '\nMobile lobby: https://%s.web.app\nVegas: https://%s.web.app\n' "$LOBBY_SITE" "$VEGAS_SITE"
printf 'Note: Firebase login may need the new mobile domain authorized.\n'
printf 'Note: Browser-exit forfeit still needs deeper Godot integration.\n'
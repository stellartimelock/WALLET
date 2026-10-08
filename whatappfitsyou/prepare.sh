#!/usr/bin/env bash
# Build a static site whose root is the "Which of my apps fit you?" quiz.
# Output: dist/whatappfitsyou/ (gitignored).
set -euo pipefail
cd "$(dirname "$0")/.."
out="dist/whatappfitsyou"
rm -rf "$out"
mkdir -p "$out/assets"
cp -a landing/assets/. "$out/assets/"
python3 - <<'PY'
from pathlib import Path
src = Path("landing/survey/index.html").read_text()
# This copy is the site root, so asset URLs are not one directory up.
out = src.replace("../assets/", "assets/")
out = out.replace(
    "https://stellartimelock.com/survey/",
    "https://whatappfitsyou.stellartimelock.com/",
)
js = Path("dist/whatappfitsyou/assets/survey.js")
js.write_text(js.read_text().replace(
    "stellartimelock.com/survey",
    "whatappfitsyou.stellartimelock.com",
))
if "../assets/" in out or 'href="../' in out:
    raise SystemExit("survey page still has relative links this host cannot serve")
Path("dist/whatappfitsyou/index.html").write_text(out)
PY
printf '%s\n' 'whatappfitsyou.stellartimelock.com' > "$out/CNAME"
# GitHub Pages ignores this file. Cloudflare Pages follows it.
printf '%s\n' '/survey/ / 301' '/survey / 301' > "$out/_redirects"
printf '%s\n' 'User-agent: *' 'Allow: /' > "$out/robots.txt"
touch "$out/.nojekyll"
echo "Built $out"

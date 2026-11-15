"""Builds app/index.html (v0.6) from the v0.5.1 base plus the files in src/.

Run from the repository root:  python3 source/build.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = ROOT / "base-v0.5.1.html"
SRC = ROOT

html = BASE.read_text(encoding="utf-8")


def swap(old, new, count=1):
    global html
    n = html.count(old)
    if n != count:
        raise SystemExit(f"Expected {count} match(es) for {old[:60]!r}, found {n}")
    html = html.replace(old, new)


# 1. Astronaut / Scientist instead of Friendly / Scientific
swap('aria-pressed="true">Friendly</button>', 'aria-pressed="true">Astronaut</button>')
swap('aria-pressed="false">Scientific</button>', 'aria-pressed="false">Scientist</button>')
swap('<span class="eyebrow">Output</span>', '<span class="eyebrow">View</span>')
# 2. Version tag
swap('<span class="vtag">v0.5</span>', '<span class="vtag">v0.6</span>')
# 3. Styles
swap("</style>\n</head>", "\n" + (SRC / "v06.css").read_text(encoding="utf-8") + "</style>\n</head>")
# 4. Scripts: v0.6 runs after the app is defined and before it starts
js = (SRC / "v06-core.js").read_text(encoding="utf-8") + "\n" + (SRC / "v06-ui.js").read_text(encoding="utf-8") + "\n" + (SRC / "v06-intake.js").read_text(encoding="utf-8") + "\n" + (SRC / "v06-neuro.js").read_text(encoding="utf-8")
swap("init();\n</script>", '</script>\n<script>\n"use strict";\n' + js + "\ninit();\n</script>")

# 5. "Health assistant" is called "Doctor" everywhere the user sees it (code names stay)
import re
before = html
html = re.sub(r"\b[Hh]ealth assistant\b", "Doctor", html)
html = re.sub(r"\b([Tt]he|[Aa]sk the|for the) assistant\b", lambda m: m.group(1) + " Doctor", html)
html = html.replace('<span class="by">Assistant', '<span class="by">Doctor').replace('"Assistant" + (m.source', '"Doctor" + (m.source').replace("<h3>Assistant</h3>", "<h3>Doctor</h3>")
html = html.replace("You are the onboard Doctor in", "You are the onboard AI doctor in")
if before == html:
    raise SystemExit("Doctor rename matched nothing")

(ROOT.parent / "index.html").write_text(html, encoding="utf-8")
print("Built", ROOT.parent / "index.html", f"({len(html) // 1024} KB)")

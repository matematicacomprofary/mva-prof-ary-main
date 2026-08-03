# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page marketing landing page ("MVA — Método Visual de Aprendizagem") for Prof. Ary's online
math course, targeting Brazilian ENEM students. Plain HTML/CSS/JS — **no build step, no bundler, no
Node/npm dependency**. `index.html` is opened/served directly; `styles.css` and `script.js` are loaded
as plain `<link>`/`<script>` tags.

`landing.MD` is the client's original copy brief (título, subtítulo, grade curricular, FAQ, garantia).
Treat it as the source of truth for marketing copy — if wording in `index.html` and `landing.MD` ever
diverge, that's a signal to check which one is stale before assuming a bug.

## Running it locally

```bash
python3 -m http.server 8000   # from the repo root
# then open http://localhost:8000/
```

There is no dev server, watcher, linter, or formatter configured — just edit the files and refresh.
Node and npm are **not** installed/assumed in this environment; don't reach for `npm install` or add a
`package.json` without checking the environment actually has Node first.

## Deployment

Static hosting via GitHub Pages, served from the `main` branch root (`/`):
- Repo: `git@github.com:lucaslealdev/mva-prof-ary.git`
- Live URL: http://lucasleal.dev/mva-prof-ary/ (the account's verified custom domain — the default
  `lucaslealdev.github.io/mva-prof-ary` URL 301-redirects there, so always share the custom-domain link)

Deploying is just `git push origin main` — GitHub Pages rebuilds automatically, no Actions workflow.

## Architecture

**Everything is vendored/self-contained on purpose — there is no CDN dependency anywhere.** KaTeX
(math formula rendering) is downloaded into `vendor/katex/` (`katex.min.css`, `katex.min.js`, and only
the `.woff2` font files actually referenced by the CSS — no `.woff`/`.ttf` fallbacks were kept). If you
add a new formula that needs a symbol from a font family not already present, re-download the specific
`.woff2` from the KaTeX npm package rather than linking a CDN.

`script.js` renders math via `katex.render()` directly (see `renderMath()`/`renderStaticFormulas()`) —
it does **not** use `vendor/katex/contrib/auto-render.min.js` (that file is vendored but currently
unused/dead weight from the initial setup). Static formulas live in `data-katex` attributes in
`index.html`; dynamic ones (the calculators) are rendered into named `<span>` targets on every input
event.

**Interactive calculators** (`initFractions`, `initPercent`, `initRuleOfThree`, `initEquation` in
`script.js`) are self-contained pure-function + DOM-update pairs, each wired to its own set of
`#fr-*`/`#pc-*`/`#r3-*`/`#eq-*` input IDs and a `#*-formula`/`#*-result-text` output pair. `window.MVA`
exposes the pure helpers (`gcd`, `fmt`, `renderMath`) so tests can exercise them without needing to
drive the DOM.

**Media**: `assets/img/` and `assets/video/` hold the curated, renamed files actually referenced by
`index.html`. `imagens/` is the original raw export (WhatsApp video + Instagram post screenshots, UUID
filenames) kept as source material — it is not linked from the page and doesn't need to stay in sync
with `assets/`. If you swap in a different challenge image/video, add the renamed copy under `assets/`
and update the `<img>`/`<source>` path in `index.html`; don't point the page at `imagens/` directly.

**CSS is mobile-first and deliberately avoids page-level horizontal scroll.** Anything that needs its
own horizontal scrolling (the KaTeX formula containers, the challenge gallery) gets `overflow-x: auto`
scoped to a `.formula-scroll`/`.gallery-track` wrapper — never on `body`. When adding new sections,
follow that pattern rather than letting wide content (long formulas, wide tables) push out the page.

The mobile nav (`.main-nav` under the `max-width: 860px` media query in `styles.css`) hides via
`max-height: 0` **and** `padding: 0` **and** `visibility: hidden`/`opacity: 0` simultaneously, on
purpose — a previous version only zeroed `max-height` and a stray padding sliver leaked through under
the sticky header. Don't simplify this back down to a single hiding mechanism.

The `#topo` anchor (site logo, "back to top") targets a dedicated empty `<span id="topo">` placed
*before* the sticky `<header id="site-header">`, not the header itself. Anchoring directly to a
`position: sticky` element that's already stuck at the top computes a zero-height scroll delta, so the
link silently does nothing once the page is scrolled — keep the sentinel span if you touch the header.

## Tests

There is no Jest/Vitest/Playwright — Node isn't assumed to be present. Tests are plain browser pages
under `tests/`, built on a ~60-line homemade runner (`tests/test-runner.js`, exposing
`TestKit.describe/it/assert/run/renderResults`). Run them by serving the repo and opening the HTML
directly:

```bash
python3 -m http.server 8000
# then open:
#   http://localhost:8000/tests/unit.test.html    — calculator math + KaTeX rendering + tabs/FAQ behavior
#   http://localhost:8000/tests/visual.test.html   — same page resized 320px→2560px in an iframe,
#                                                     checked for horizontal overflow, the mobile-nav
#                                                     breakpoint, and 44px min touch targets
```

Both load the *real* `index.html` inside an iframe (same-origin, hence the http server requirement —
opening via `file://` breaks iframe access in Chromium-based browsers) and drive it through real
`input`/`click` events rather than mocking the DOM. When adding a new interactive element, prefer
extending one of these two files over introducing a new test tool/framework.

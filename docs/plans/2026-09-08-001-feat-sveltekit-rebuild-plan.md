---
title: "feat: Rebuild ajensen.org as a SvelteKit static site on GitHub Pages"
type: feat
status: active
date: 2026-09-08
origin: docs/brainstorms/2026-09-08-sveltekit-rebuild-ajensen-org-requirements.md
---

# feat: Rebuild ajensen.org as a SvelteKit static site on GitHub Pages

## Overview

Replace the stock, never-populated al-folio Jekyll site with a greenfield SvelteKit 2 +
Svelte 5 static site (`@sveltejs/adapter-static`), deployed by GitHub Actions to GitHub
Pages under the existing custom domain `www.ajensen.org` (root deployment — `paths.base`
stays empty). Content is a fresh start: publications/talks parse from a vendored
Zotero-exported `cv.bib`; posts are authored in Emacs org mode and manually ox-exported to
markdown with a build-time staleness gate; styling is Tailwind CSS 4 + daisyUI 5. Infra
first, content second, design last — the domain is verified on a minimal landing page
before any real content or design work.

---

## Problem Frame

The current site is al-folio demo material (11 theme posts, `announcement_1–3`,
`1_project–6_project`); the only real artifacts are `_bibliography/papers.bib` (2 real
Zotero-exported entries), the personalized giscus config in `_config.yml`, `CNAME`, and the
requirements doc. Andrew wants design control, wants to learn Svelte, and wants a
publishing flow that matches how he already works (org mode, Zotero, LaTeX CV). The one
high-stakes constraint: **do not break `www.ajensen.org`'s custom-domain serving** while
swapping the deploy pipeline. Full frame: see origin document.

---

## Requirements Trace

Carried from origin (R1–R20): v1 pages (R1); build-time publications from vendored
`cv.bib` with `keywords` comma-split classification (R2); org→md authoring with loud
absent-or-stale build failure (R3, R5); talks from the same `cv.bib`, projects from data
files (R4); Jekyll-like content layout (R6); Tailwind 4 + daisyUI with no markup lock-in
(R7, R8); pre-paint theme application, no flash, no-JS readable (R9); Actions-native deploy
with `pages: write` / `id-token: write` / `contents: read` (R10); `.nojekyll` + `CNAME`
from `static/` into every build (R11); domain continuity with zero DNS changes (R12);
`fallback: '404.html'` (R13); single deploy path after cleanup (R14); RSS/sitemap at build
time (R15); per-page Open Graph (R16); full prerendering with loud failure (R17); IA/nav
order + homepage hierarchy (R18); mobile-first (R19); keyboard/WCAG-AA/alt-text (R20).

**Origin actors:** A1 (Andrew — author/owner), A2 (visitors: employers, collaborators, lab
PIs), A3 (agent — builds end-to-end, Andrew inspects)

**Origin acceptance examples:** none defined in origin; test scenarios below cover the
behavior instead.

---

## Scope Boundaries

- No migration of al-folio demo content — the Jekyll tree is deleted, not redirected (no
  old permalinks to preserve).
- No comments system in v1. Note: `_config.yml` contains a **personalized giscus config**
  (`repo: ajensen1234/ajensen.org` + ids) — preserve that snippet in the README as a
  future-readd note before deleting the config.
- No math rendering in v1 (default decision from origin review); no photo galleries; no
  Distill-style posts.
- No apex-domain (`ajensen.org`) DNS changes — read-only check only (U2 verification).
- No redesign-first: units U1–U6 build plain-but-clean pages; bespoke design is U7.
- `repomix-output.xml` is a generated artifact — deleted, not gitignored-and-kept (U1).

---

## Context & Research

### Relevant Code and Patterns

- `bin/deploy` (current): builds Jekyll, force-pushes `gh-pages`, preserves `CNAME` +
  `.nojekyll` via `keep_files` — replaced by U2's workflow.
- `.github/workflows/deploy.yml`: triggers on `master`/`main` push/PR, runs `bin/deploy`
  — **disable in the same change as the Pages source flip (U2)**, delete at U8.
- `_bibliography/papers.bib`: Zotero export shape — `keywords` values are arbitrary user
  tags, backslash-escaped `file` paths, LaTeX braces. The vendored `cv.bib` parser must
  tolerate this (verbatim fields, comma-split).
- Default branch is **`master`** (`jj bookmark list`) — the new workflow must trigger on
  `master` (renaming to `main` is out of scope unless Andrew asks).
- Repo is jj 0.44 git-colocated: all commits via `jj commit -m` / `jj split <files> -m` /
  `jj describe -m` — never `jj ci`, `--amend`, bare `jj split`, or `jj move` (institutional
  learning: jj-guard one-contract, 2026-08-13).

### Institutional Learnings

- `/home/ajj/.pi/docs/solutions/architecture-patterns/jj-agent-guard-one-contract-2026-08-13.md`
  — non-interactive jj vocabulary; generated artifacts vs snapshot limits (drives U1's
  gitignore-first commit).
- No other prior art exists for this stack in `docs/solutions/` — greenfield territory;
  capture a learning at U8.

### External References

- adapter-static GH Pages guidance (root domain, empty base, `.nojekyll`): svelte.dev/docs/kit/adapter-static
- Actions versions verified 2026-09: `actions/checkout@v7`, `actions/configure-pages@v6`,
  `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`
- mdsvex 0.12.8 (Svelte 5 peer; ≥0.12.7 required for Svelte ≥5.53); open issue #738: no
  runes inside `.md`/`.svx` when `layout:` is used — content-only markdown, runes in
  `.svelte` layouts
- Kit 2.70 peer range is `vite ^5 || ^6 || ^8` (skips 7) → **Vite 8 + vite-plugin-svelte 7,
  Node 22** in CI
- daisyUI 5 + Tailwind 4: CSS-first `@plugin 'daisyui'` in `app.css`, no tailwind.config.js
- `@retorquere/bibtex-parser` **v10**: `parse(bib, { verbatimFields: ['keywords', …] })`;
  authors arrive as decoded `Creator[]`; `keywords` is a plain string; comma-split for
  classification
- RSS/sitemap as prerendered `+server.ts` endpoints (svelte.dev/docs/kit/seo pattern)

---

## Key Technical Decisions

- **Trigger branch: `master`** (current trunk). Renaming to `main` would be a
  muscle-memory change with zero site benefit; noted as an option, not done.
- **Vite 8 + vite-plugin-svelte 7 + Node 22** — the only combo satisfying Kit 2.70's peer
  range going forward; fallback combo (Vite 7 + vps 6) documented if something breaks.
- **Package manager / runtime: Bun** (Andrew's choice, decided at execution start):
  `bun install` with `bun.lock` committed; scripts run via `bun run`; TypeScript scripts
  (`scripts/check-content.ts`) execute directly with bun — no `tsx` dependency. CI uses
  `oven-sh/setup-bun@v2` + `bun install --frozen-lockfile`.
- **R17 loudness lives in the prerenderer, not the adapter**: `fallback: '404.html'`
  switches adapter-static into SPA-tolerant mode and mutes its strict-route error. Keep
  `strict: true` anyway, rely on default `handleError: 'fail'` + `handleHttpError: 'fail'`,
  and make the U2 smoke check verify the route count in the build log.
- **Staleness hash covers the whole org file** (whitespace-normalized), not just the body —
  title/tag-only edits must also invalidate. Bidirectional check: missing md → error; md
  with no org (orphan) → error; missing required frontmatter → error.
- **Keyword classification defaults**: unknown keyword (matches none of
  `publication`/`invited-talk`/`presentation`) → **build error naming the citekey** (never
  silently drop); multi-category entry → renders in all matching sections; parse failure →
  build error.
- **Talks link convention**: `url` field = paper link, `note` field = slides/video links.
- **Author highlighting**: site-owner name as a single site constant; parsed author names
  matched against it for bolding (replaces al-folio's `scholar:last_name`).
- **Projects are list-only in v1** (no detail routes, no slug machinery); data-file schema
  defined in U5.
- **Rollback story**: (1) during migration — flip Pages source back to `gh-pages` branch
  (restores old demo site); (2) any time — **re-run the previous green workflow run**
  (re-deploys last good artifact). After U8 deletes `gh-pages`, (2) is the only rollback.
- **Old `deploy.yml` is disabled at U2** (Pages source flip), not at cleanup — prevents
  double-pipeline confusion; Docker workflows + `bin/` deleted at U8.
- **RSS = full rendered HTML content** (mdsvex renders at build; nearly free; matches the
  pattern the origin cites).
- **Learning mechanism** (origin annotated-commit criterion): each unit's commit message
  carries a short walkthrough note of the Svelte idioms it introduced; the U7 guided
  first-tweak and U8 learning capture are the capstones — this is the origin criterion
  made explicit, not a silent replacement.

---

## Output Structure

    ajensen.org/
    ├── .github/workflows/deploy.yml        # new Actions workflow (replaces al-folio's)
    ├── docs/brainstorms/…requirements.md   # origin doc (already present)
    ├── docs/plans/…plan.md                 # this file
    ├── static/
    │   ├── .nojekyll                       # R11
    │   ├── CNAME                           # www.ajensen.org (R11)
    │   ├── robots.txt
    │   ├── resume.pdf                      # vendored (R1)
    │   └── og-default.png                  # default OG image (R16)
    ├── src/
    │   ├── app.html                        # pre-paint theme script (R9)
    │   ├── app.css                         # Tailwind 4 + daisyUI 5 (R7)
    │   ├── lib/
    │   │   ├── site.ts                     # single origin constant (R16/R15)
    │   │   ├── server/
    │   │   │   ├── bibtex.ts               # cv.bib parse + classification (R2, R4)
    │   │   │   ├── posts.ts                # content loading + staleness helpers (R3)
    │   │   │   └── og.ts                   # OG tag helper (R16)
    │   │   └── components/                 # nav, theme toggle, publication entry…
    │   ├── content/
    │   │   ├── posts/                      # *.org + exported *.md (R3, R6)
    │   │   └── projects/                   # one data file per project (R4, R6)
    │   ├── data/cv.bib                     # vendored from ~/repo/resume-cv (R2)
    │   └── routes/
    │       ├── +layout.svelte|ts           # prerender=true, trailingSlash='always'
    │       ├── +page.svelte                # home (R18)
    │       ├── +error.svelte              # styled 404 (R13)
    │       ├── publications/+page.svelte   # R2
    │       ├── talks/+page.svelte          # R4
    │       ├── projects/+page.svelte       # R4
    │       ├── blog/+page.svelte           # R1
    │       ├── blog/[slug]/+page.svelte    # R1
    │       ├── cv/+page.svelte             # R1
    │       ├── rss.xml/+server.ts          # R15
    │       └── sitemap.xml/+server.ts      # R15
    ├── svelte.config.js                    # adapter-static, fallback, mdsvex
    ├── vite.config.ts                      # tailwindcss() + sveltekit()
    └── scripts/check-content.ts            # staleness gate (R5), run as prebuild

(This is a scope declaration, not a constraint — the implementer may adjust structure
during implementation; per-unit Files sections are authoritative.)

---

## Implementation Units

- [x] U1. **Repo hygiene + SvelteKit scaffold**

**Goal:** Greenfield SvelteKit app builds locally; static/domain files guaranteed in build output.

**Requirements:** R7, R11, R13 (partial: fallback mechanism), R17 (partial: prerender config), R18 (partial: minimal landing page)

**Dependencies:** None

**Files:**
- Create: `.gitignore` (extend: `node_modules/`, `.svelte-kit/`, `build/`), `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/app.css`, `src/routes/+layout.svelte`, `src/routes/+layout.ts`, `src/routes/+page.svelte`, `static/.nojekyll`, `static/CNAME`, `static/resume.pdf` (vendored), `src/lib/site.ts`
- Delete: `repomix-output.xml`
- Modify: `README.md` (stub note: rebuild in progress; preserve giscus config snippet)

**Approach:**
- First commit is hygiene-only: delete `repomix-output.xml`, update `.gitignore`, `jj describe -m` the change holding the requirements doc — so the scaffold commit doesn't trip jj's snapshot limit.
- Scaffold written as a manual manifest (bun-managed) rather than `npx sv create`
  (scaffold-into-nonempty-repo friction); pins: svelte 5.x, @sveltejs/kit 2.x,
  @sveltejs/adapter-static 3.x, vite 8, @sveltejs/vite-plugin-svelte 7, tailwindcss 4 +
  @tailwindcss/vite + daisyui 5, mdsvex 0.12.8.
- `svelte.config.js`: adapter-static `{ pages: 'build', assets: 'build', fallback: '404.html', strict: true }`; no `paths.base`; mdsvex `extensions: ['.svx', '.md']`; `kit.prerender.entries: ['*']`.
- `src/routes/+layout.ts`: `export const prerender = true; export const trailingSlash = 'always';`
- `app.css`: `@import 'tailwindcss'; @plugin 'daisyui' { themes: light --default, dark --prefersdark; }`.
- `app.html`: inline pre-paint theme script (localStorage → `prefers-color-scheme` → `data-theme` on `<html>`) — R9 mechanics land here, toggle UI in U7.
- `static/CNAME` contains `www.ajensen.org`; `static/.nojekyll` empty; vendored `static/resume.pdf` copied from `~/repo/resume-cv/resume.pdf`.
- Minimal landing page: name, role, one-paragraph intro (R18 hierarchy seed).

**Patterns to follow:** daisyUI 5 Vite install docs; framework-researcher's svelte.config.js shape.

**Test scenarios:**
- Happy path: `npm run build` exits 0; `build/index.html`, `build/404.html`, `build/.nojekyll`, `build/CNAME` (content `www.ajensen.org`) all exist.
- Edge case: `build/` contains `_app/` asset dir and its files are reachable (simulate: `npx serve build` + request a `/_app/` asset → 200).
- Verification of theme script: view-source of `build/index.html` shows the inline script *before* the stylesheet link.

**Verification:** Local build green; `build/CNAME` + `build/.nojekyll` present; `npm run check` clean.

---

- [x] U2. **Actions deploy + Pages source cutover**

**Goal:** Push to `master` deploys the site via Actions; custom domain survives; old pipeline disabled; rollback documented.

**Requirements:** R10, R11, R12, R14 (partial), R17 (smoke check)

**Dependencies:** U1

**Files:**
- Create: `.github/workflows/deploy.yml` (replaces the al-folio one at the same path)
- Modify: `.github/workflows/deploy.yml` history (the old one is overwritten in the same change); `README.md` (rollback runbook)

**Approach:**
- Two-job workflow on `push: branches: [master]` + `workflow_dispatch`: root `permissions: { contents: read, pages: write, id-token: write }`; `concurrency: { group: pages, cancel-in-progress: true }`; build job (`checkout@v7`, `oven-sh/setup-bun@v2`, `bun install --frozen-lockfile`, `configure-pages@v6`, `bun run check && bun run build`, `upload-pages-artifact@v5` with `path: build`); deploy job (`needs: build`, `environment: { name: github-pages, url: … }`, `deploy-pages@v5`).
- Post-deploy smoke-check job/step: curl every nav route (Home, Publications, Projects, Talks, Blog, CV per R18 — the list grows as units land), one `/_app/` asset (200), a garbage URL (404), `build/CNAME` served — encodes the footgun checklist so a `.nojekyll`-class regression fails CI. Because fallback mode permanently removes the adapter's strict all-routes guarantee, this check (plus a build-log assertion that the prerendered-route count meets a floor) is the durable R17 loudness mechanism, not a one-time verification.
- Same change: old al-folio `deploy.yml` is fully replaced (disabled by replacement), Docker workflow deletion deferred to U8.
- Runbook in README: rollback = re-run previous green workflow run; interim-only = flip Pages source back to `gh-pages` (retired at U8).
- **Cutover order matters:** flip Settings → Pages source to "GitHub Actions" and verify the domain setting *before* the first push to master — otherwise the first deploy-pages run fails with a Pages-configuration error. One-time manual step (A1 or A3 via gh CLI): repo Settings → Pages → Source = "GitHub Actions"; verify custom domain still `www.ajensen.org` and Enforce HTTPS on. Read-only DNS check: `www` CNAME + apex `ajensen.org` behavior recorded (no changes).

**Patterns to follow:** actions/deploy-pages README two-job pattern; starter-workflows#3205.

**Test scenarios:**
- Integration: push to `master` → workflow green → `https://www.ajensen.org` serves the landing page over HTTPS with the custom domain (not `ajensen.github.io`).
- Error path: intentionally break a route (delete a page a link points to) → build fails (`handleHttpError: 'fail'`), live site unchanged, previous deployment still serving.
- Edge case: rapid double push → concurrency group cancels the older run; final state matches the newest push.

**Verification:** Live domain check passes all footgun checklist items; workflow log lists every prerendered route (fallback mutes adapter strict errors — verify route count explicitly).

---

- [x] U3. **Content pipeline: org→md export + staleness gate**

**Goal:** Andrew's authoring loop works end-to-end: edit `.org`, run export, commit, push — with a loud, actionable build failure if the export is absent or stale.

**Requirements:** R3, R5, R6, R17

**Dependencies:** U1

**Files:**
- Create: `src/content/posts/` (first real post: one `hello-world.org` + `hello-world.md`), `scripts/check-content.ts`, `scripts/org-export.el` (or documented Emacs interactive command), `src/lib/server/posts.ts`, `.emacs.d`-side setup documented in `docs/content-authoring.md`
- Modify: `package.json` (`prebuild` runs `bun scripts/check-content.ts`), `README.md` (publish flow)

**Approach:**
- Export contract (frontmatter schema): `title`, `date` (from org property, never the clock — deterministic export), `description`, `tags`, `org_hash`. The ox-md backend/template stamps `org_hash` = sha256 of the **whole org file**, whitespace-normalized.
- `scripts/check-content.ts`: bidirectional walk of `src/content/posts/` — org without md → error; md without org (orphan) → error; frontmatter missing required fields → error; recomputed hash ≠ stamped hash → error with actionable message naming the file and the fix (re-run export). Exit non-zero → `prebuild` fails before vite.
- mdsvex consumes `*.md` as content-only (no runes in markdown — mdsvex #738); post rendering uses the shared layout via mdsvex `layout` config in U6's blog routes (routes land there; the pipeline + one test post land here, verified via a temporary route or unit test).
- Authoring docs (`docs/content-authoring.md`): the publish flow, the export command, the local pre-push check (`npm run build`), and the never-hand-edit rule for vendored files.

**Patterns to follow:** ox-hugo's org-keyword → frontmatter mapping (reference for the template); bibtex `verbatimFields` precedent for stamping opaque values.

**Test scenarios:**
- Happy path: valid org + matching exported md (hash matches) → check exits 0.
- Error path: org edited after export (hash mismatch) → non-zero exit, message names the file and fix command.
- Error path: md deleted while org remains → non-zero exit (absent markdown).
- Edge case: orphan md (org deleted, md remains) → non-zero exit.
- Edge case: md missing `title`/`date` frontmatter → non-zero exit (required-field validation).
- Edge case: fresh clone (mtimes all identical) → hash check still correct (mtime never consulted).

**Verification:** `npm run build` runs the gate; deliberately-stale fixture fails locally with the actionable message; the test post renders via mdsvex.

---

- [ ] U4. **Publications & talks from vendored cv.bib**

**Goal:** `/publications/` and `/talks/` render at build time from the vendored bib with classification, author highlighting, and loud failure on bad data.

**Requirements:** R2, R4 (talks), R15 (feeds read the same data later), R17

**Dependencies:** U1

**Files:**
- Create: `src/data/cv.bib` (vendored from `~/repo/resume-cv/cv.bib`), `src/lib/server/bibtex.ts`, `src/routes/publications/+page.svelte`, `src/routes/talks/+page.svelte`, `src/lib/components/PublicationEntry.svelte`
- Modify: `docs/content-authoring.md` (cv.bib refresh flow), `package.json` (dev dep `@retorquere/bibtex-parser`)

**Approach:**
- Parse with `@retorquere/bibtex-parser` v10: `parse(bib, { verbatimFields: ['keywords', 'url', 'doi', 'note'] })`; non-empty `library.errors` → throw (build fails).
- Classification: split `keywords` on commas, trim; entry matching none of `publication`/`invited-talk`/`presentation` → build error listing the citekey (never silently drop); multi-category → render in all matching sections.
- Publications page sections in CV order: Publications, Invited Talks, Presentations; year-descending sort with citekey tiebreak (deterministic across Zotero re-exports).
- `/talks/` renders all entries matching `invited-talk` or `presentation`, merged chronologically (newest first), reusing `PublicationEntry`; the publications page keeps its three CV-order sections.
- Author highlighting: site constant `OWNER_NAME` in `src/lib/site.ts`; bold matching parsed authors (first+last name comparison, case-insensitive).
- Talk links: `url` = paper, `note` = slides/video (parsed into labeled links).
- Empty category (e.g., no `presentation` entries yet) renders a visible section placeholder, not an invisible section.
- Parse happens in a build-time module (`+page.server.ts` load with `prerender = true` — runs during prerender and is stripped from the client bundle; `$lib/server` imports are forbidden in universal `+page.ts` loads); bib read via `?raw` import from `src/data/cv.bib`.

**Patterns to follow:** hideCustomBibtex.rb's field-hiding intent (ancestor of verbatim fields); origin doc's Verified infra facts for parser API.

**Test scenarios:**
- Happy path: vendored cv.bib parses; each `keywords` category renders its entries; compound `exactech,presentation` lands in presentations.
- Error path: entry with unknown keywords (fixture) → build error naming the citekey.
- Error path: malformed BibTeX fixture → build error (non-zero), not an empty page.
- Edge case: entry with two category keywords → appears in both sections.
- Edge case: author list containing the owner name → owner bolded; `{van} Doe`-style prefixes render correctly (parser-decoded unicode).

**Verification:** `/publications/` and `/talks/` prerender with real entries from the vendored bib; a deliberately-broken fixture build fails loudly.

---

- [ ] U5. **Projects data pages + CV page**

**Goal:** Projects render from simple data files (one file per project); CV page links the vendored PDF.

**Requirements:** R1, R4 (projects), R6

**Dependencies:** U1, U4 (shared page chrome)

**Files:**
- Create: `src/content/projects/` (JTML, Orthopedic Driven Imaging, PhD work as first entries), `src/routes/projects/+page.svelte`, `src/routes/cv/+page.svelte`
- Modify: `docs/content-authoring.md` (project data-file schema)

**Approach:**
- Project data file schema (one YAML/markdown-hybrid file per project): `title`, `period`, `summary`, `role`, `links` (label/url pairs), `highlight: true` for homepage surfacing. List-only in v1 — no detail routes, no slugs to validate (Key Decision).
- Loaded via `import.meta.glob` with eager metadata extraction; schema validated at load (zod or hand-rolled guard) → malformed project file = build error.
- CV page: explicit section list — Education, Positions (each a small YAML mirroring the LaTeX CV with a defined schema), plus a prominent `/resume.pdf` link (default decision from origin review; Andrew can override at plan review). The YAML is a hand-maintained mirror of the PDF: keep it to a one-screen summary and re-verify against `resume.pdf` on each edit (documented in `docs/content-authoring.md`).

**Patterns to follow:** origin R4's "adding an entry is editing one file"; Jekyll `_projects` frontmatter shape (familiar mental model).

**Test scenarios:**
- Happy path: three real project files → cards render ordered by `highlight` then `period` descending.
- Error path: project file missing `title` → build error naming the file.
- Edge case: project with zero links → card renders without a links row (no empty markup).
- Integration: `/cv/` links to `/resume.pdf` and the PDF is present in `build/` (copied from `static/`).

**Verification:** `/projects/` and `/cv/` prerender with real content; adding a fourth project file changes the page without code edits.

---

- [ ] U6. **Blog routes + RSS/sitemap/robots + Open Graph**

**Goal:** Full blog surface (index + post routes), prerendered RSS with full content, truthful sitemap, per-page OG tags.

**Requirements:** R1, R15, R16, R17

**Dependencies:** U3 (posts pipeline), U4 (site constants)

**Files:**
- Create: `src/routes/blog/+page.svelte`, `src/routes/blog/[slug]/+page.svelte`, `src/routes/rss.xml/+server.ts`, `src/routes/sitemap.xml/+server.ts`, `static/robots.txt` (replace Jekyll one), `src/lib/server/og.ts`, `static/og-default.png` (placeholder until A1 supplies a real one)
- Modify: `src/lib/server/posts.ts` (shared post-metadata module feeding blog index, RSS, and sitemap); `src/routes/+page.svelte`, `publications/+page.svelte`, `talks/+page.svelte`, `projects/+page.svelte`, `cv/+page.svelte` (per-page OG tag wiring — R16 covers every page, so each route owns its og:title/description)

**Approach:**
- Blog index: posts sorted date-desc; `[slug]` route with `export const entries` derived from the post list (no crawling dependence).
- Single source of truth: `posts.ts` exports post metadata consumed by index, RSS, and sitemap — slugs/dates never duplicated (feeds must agree with pages).
- RSS: RSS 2.0, full rendered HTML content (mdsvex renders at build), `<guid isPermaLink="true">`, RFC-822 dates, XML-escaped, capped ~20 items; valid XML even with zero posts.
- Sitemap: all canonical URLs; `<lastmod>` from post dates (never build time); `Sitemap:` line added to `robots.txt` (hardcoded `https://www.ajensen.org/sitemap.xml` — base is empty).
- OG helper: every page emits `og:title/description/url/type/image` via `<svelte:head>`; posts without an image fall back to `og-default.png` — no tagless share cards.
- All URLs derive from the single `site.ts` origin constant.

**Patterns to follow:** svelte.dev/docs/kit/seo sitemap pattern; kylenazario full-content RSS pattern.

**Test scenarios:**
- Happy path: `/blog/` lists the test post; `/blog/<slug>/` renders it via mdsvex layout.
- Integration: `/rss.xml` returns valid XML (parse it) whose items' links/guids match rendered post URLs exactly; `/sitemap.xml` includes every route; `robots.txt` references the sitemap.
- Edge case: zero posts → RSS still valid XML (empty channel); blog index renders the R1 placeholder treatment.
- Edge case: post frontmatter lacking `description` → OG helper falls back to a site-level default (never an empty og:description).

**Verification:** All routes in the build log; RSS/sitemap parse cleanly; share-preview tags present on home + a post (view-source).

---

- [ ] U7. **Design system, IA, theming, accessibility pass**

**Goal:** The fun part — bespoke layout and theming on the working pipeline: nav per R18, theme toggle per R9, responsive + a11y per R19/R20.

**Requirements:** R7, R8, R9, R13 (styled 404 content), R18, R19, R20; R1 placeholder treatment

**Dependencies:** U1–U6 (real content on real routes)

**Files:**
- Create: `src/lib/components/` (Nav.svelte, ThemeToggle.svelte, Footer.svelte), `src/routes/+error.svelte` (styled 404 rendered by the fallback shell's client-side error boundary), custom daisyUI theme tokens in `src/app.css`
- Modify: all route pages (layout composition), `src/app.html` (if theme script adjustments needed)

**Approach:**
- Nav: single-level, fixed order (Home, Publications, Projects, Talks, Blog, CV) per R18; mobile strategy inline links (only ~6 sections — no menu machinery).
- ThemeToggle: writes localStorage + sets `data-theme`; default derives from `prefers-color-scheme`; U1's pre-paint script already prevents flash; page readable with JS disabled (toggle simply absent then).
- Define 1–2 custom daisyUI themes via CSS variables (design brief: typography + layout feel decided with A1 during this unit — the guided "first tweak" exercise happens here; this is the learning checkpoint).
- A11y pass: keyboard-operable toggle, visible focus states, WCAG AA contrast between the theme pairs, alt text on all images.
- Styled 404 page content: `+error.svelte` rendered inside the fallback shell's client-side error boundary (note: the shell is blank without JS — acceptable; content pages remain no-JS readable per R9).
- Homepage composition (R18's second half, owned here since publication data exists): identity + role hero, links to the latest 3 publications and the CV, and a highlighted-projects section consuming U5's `highlight` flag.
- Placeholder treatment (defined once, referenced by U4/U6): a styled daisyUI note — short heading plus one line ("Nothing here yet — first post coming soon") — reused by the zero-posts blog index and empty publication categories.
- Nav active state: the current section's link is visually distinguished and marked `aria-current="page"`.
- Svelte 5 idioms throughout: runes mode, `onclick`, snippets, keyed each blocks keyed by citekey/slug (never index).

**Patterns to follow:** Svelte 5 curated skills (runes-mode best practices); daisyUI theming docs.

**Test scenarios:**
- Happy path: toggle switches light/dark, persists across reload, no first-paint flash (throttled-CPU visual check), no layout shift.
- Edge case: JS disabled → default theme renders, all content readable, nav links work.
- Edge case: keyboard-only navigation reaches every interactive element with visible focus.
- Error path: 404 page renders styled with the fallback shell for unknown deep paths (e.g., `/blog/nonexistent/`).

**Verification:** R19 spot-checks at common phone widths; axe DevTools or manual audit with zero critical violations; A1 performs the guided first tweak.

---

- [ ] U8. **Cleanup + end-to-end verification + learning capture**

**Goal:** Exactly one deploy path; repo reads as a SvelteKit site, not a theme archaeology dig; the rebuild becomes institutional knowledge.

**Requirements:** R14, R12 (final), origin Success Criteria

**Dependencies:** U2–U7 all verified

**Files:**
- Delete: `_config.yml`, `_pages/`, `_posts/`, `_news/`, `_projects/`, `_data/`, `_bibliography/`, `_includes/`, `_layouts/`, `_sass/`, `_plugins/`, `assets/` (after carrying over `prof_pic.jpg` → `static/`), `bin/`, `Dockerfile`, `docker-compose.yml`, `docker-local.yml`, `.github/workflows/deploy-image.yml`, `.github/workflows/deploy-docker-tag.yml`, `Gemfile`, `404.html` (root), `robots.txt` (root — moved to `static/` in U6), `.github/FUNDING.yml`, `.github/stale.yml`, `.github/ISSUE_TEMPLATE/`, `CONTRIBUTING.md`, `.all-contributorsrc`, `blog/`
- Modify: `README.md` (real content: stack, publish flow, deploy flow, rollback runbook, giscus re-add snippet), `.gitignore` (drop Jekyll entries)
- Delete: `gh-pages` branch (after confirming re-run-previous-run rollback is accepted as the permanent story)

**Approach:**
- Deletion order: Docker workflows and stale al-folio config first, Jekyll tree last (each deletion is a green-build commit).
- Final verification = full footgun checklist from the origin doc + fresh-clone build test (`jj git clone` equivalent → `npm ci && npm run build` → green).
- Capture a `/ce-compound` learning: SvelteKit static + GH Actions Pages + root-domain caveats, org→md hash-staleness pipeline, bibtex keyword classification.

**Test scenarios:**
- Integration: full publish flow rehearsal by A1 — edit an org file, export, commit, push, watch it live (origin Success Criterion: verified once end-to-end by Andrew himself).
- Error path: stale export pushed → CI red with actionable message; fix by re-exporting; green.
- Edge case: re-run previous green workflow run → site reverts to last good deployment (rollback story verified before `gh-pages` deletion).

**Verification:** Zero Jekyll files remain; single workflow file; fresh clone builds and deploys; A1 has published once unassisted.

---

## System-Wide Impact

- **Interaction graph:** One external surface changes — GitHub Pages serving. The custom-domain setting, DNS, and Enforce HTTPS are untouched; only the deploy mechanism swaps. `www.ajensen.org` continuity is the invariant.
- **Error propagation:** All content errors (staleness, bibtex, project schema, unknown keywords) fail the *build*, never the live site — deploy-pages only runs on green, so the last good deployment serves through any failure.
- **State lifecycle risks:** Vendored files (`cv.bib`, `resume.pdf`) can silently go stale — mitigated by the documented one-habit sync flow and the never-hand-edit rule.
- **API surface parity:** n/a (static site).
- **Integration coverage:** The step-3 smoke check (homepage + `/_app/` asset + 404) and U2's route-count log check encode the footgun checklist in CI rather than human memory.
- **Unchanged invariants:** DNS records, GitHub Pages custom-domain setting, `CNAME` content (`www.ajensen.org`).

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| mdsvex ↔ Svelte 5 regressions (0.12.6 broke on Svelte ≥5.53; #738 open for runes+layout) | Pin mdsvex ≥0.12.8; content-only markdown; runes only in `.svelte` layouts; verify at U1 scaffold time |
| Kit 2.70 peer range skips Vite 7 → forced Vite 8 | Deliberate Vite 8 + vps 7 + Node 22 combo; fallback combo documented |
| `fallback: '404.html'` mutes adapter strict errors | Rely on prerender `handleError`/`handleHttpError: 'fail'` defaults + explicit route-count verification in U2 |
| Custom-domain breakage during source flip | Footgun checklist as U2 smoke check; never touch domain settings; rollback via re-run-previous-run |
| jj snapshot limits on generated files | U1 hygiene commit first (delete `repomix-output.xml`, gitignore `build/`/`node_modules/`/`.svelte-kit/`) |
| Zotero exports arbitrary keywords (papers.bib precedent) | Unknown-keyword = build error (loud, never silent); verbatim fields for parsing |
| Stale vendored cv.bib/resume.pdf publishes old data silently | One-habit sync flow documented; never-hand-edit rule; flagged in README |
| Old deploy.yml firing alongside new pipeline | Replaced in the same change as the Pages source flip (U2) |
| OG default image not yet supplied by A1 | Placeholder `og-default.png` in U6; flagged as follow-up |

---

## Documentation / Operational Notes

- `README.md` rewritten at U8: stack overview, publish flow (org edit → export → commit → push), cv.bib sync flow, deploy/rollback runbook, giscus re-add snippet.
- `docs/content-authoring.md` (U3–U5): the authoring contract — frontmatter schema, export command, staleness rules, project data schema, vendored-file rules.
- `docs/content-authoring.md` is the single place the export contract lives — if the ox-export template changes, bump its version into the hash input (researcher-recommended hardening).

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-09-08-sveltekit-rebuild-ajensen-org-requirements.md](../brainstorms/2026-09-08-sveltekit-rebuild-ajensen-org-requirements.md)
- Related code: `bin/deploy`, `.github/workflows/deploy.yml`, `_bibliography/papers.bib`, `_config.yml` (giscus block)
- External docs: svelte.dev/docs/kit/adapter-static · daisyui.com/docs/install/vite · retorque.re/bibtex-parser · github.com/actions/deploy-pages · github.com/pngwn/MDsveX (issues #738, #778/#779)

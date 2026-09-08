---
date: 2026-09-08
topic: sveltekit-rebuild-ajensen-org
---

# SvelteKit Rebuild of ajensen.org

## Problem Frame

Andrew's personal site (`ajensen.org`) is a stock al-folio Jekyll instance that was never
populated — its posts, news, and projects are the theme's demo placeholders. The real content
lives elsewhere: a LaTeX CV + `cv.bib` in `~/repo/resume-cv` (PhD in Mechanical Engineering /
orthopaedic biomechanics ML, Senior AI Architect at Orthopedic Driven Imaging, JTML, pubs,
talks), and Andrew authors everything in Emacs org mode.

The site should be rebuilt as a SvelteKit static site (Svelte 5, `@sveltejs/adapter-static`)
on the same GitHub Pages hosting with the same custom domain (`www.ajensen.org`), because
Andrew wants design control, wants to learn Svelte, and finds the al-folio look generic.
This is a **greenfield build with two content imports** (publications from `cv.bib`, pages
from org files) plus one serious infra task: replacing the al-folio `bin/deploy` → `gh-pages`
pipeline with GitHub Actions **without breaking the custom domain**.

The original "measure twice" migration-audit task was written for a content-heavy repo; the
repo scan showed the content is stock demo material, so the audit's heavy items (Distill
posts, Disqus/giscus, redirect maps for old permalinks, masonry galleries) are out of scope
by default.

---

## Actors

- A1. Andrew (site owner/author): writes content in org mode in Emacs; wants zero-friction
  publishing and no infrastructure footguns.
- A2. Site visitors: potential employers, collaborators, lab PIs using JTML, conference
  organizers — mostly arriving via the custom domain.
- A3. Agent (me): builds the entire site end-to-end; Andrew inspects afterward.

---

## Requirements

**Content & pages (v1)**

- R1. Ship these pages in v1: home/about, publications, projects (JTML + startup work),
  presentations/invited talks, blog, CV. Anything without ready content ships as a
  styled placeholder.
- R2. Publications are generated at build time from a copy of `~/repo/resume-cv/cv.bib`
  vendored into this repo (CI cannot see external paths), which tags entries with
  `keywords` fields (`publication`, `invited-talk`, `presentation`); matchers must split
  compound values (e.g. `exactech,presentation`) on commas. The three categories render
  as separate sections as in the current LaTeX CV.
- R3. Blog posts are authored as org files and exported to markdown with a single manual
  command (Emacs ox-export); the site build consumes only markdown.
- R4. Presentations/invited talks render from the vendored `cv.bib` (filtered by
  `keywords`) — the same single source as the publications page's talks sections.
  Projects are data-driven pages rendered from simple structured data files, so adding
  an entry is editing one file.

**Authoring workflow**

- R5. Day-to-day publishing is: edit an org file → run the export command → commit → push.
  (Adding a publication/talk: refresh the vendored `cv.bib` from upstream, commit — same
  flow.) If the export step is forgotten, the push must not silently publish stale or
  missing content: the build fails loudly if a post's exported markdown is absent OR
  stale. Staleness is detected by a content hash of the org body, stamped into the
  exported markdown's frontmatter at export time and verified at build; mtime comparison
  must not be used (fresh clones invalidate it).
- R6. The content layout in the new repo keeps a Jekyll-like feel (one folder per content
  type, one file per post/entry) so Andrew's mental model carries over.

**Design & theming**

- R7. Styling starts from Tailwind CSS 4 + daisyUI, chosen so that theme switching is a
  built-in capability (swap a theme attribute) and no template or library owns the markup.
- R8. The design must not lock content, routes, or data away from a future bespoke redesign;
  migrating to hand-rolled components later is a page-at-a-time change, never a content or
  data migration.
- R9. Dark/light theming works and remembers the visitor's choice. The theme is applied
  before first paint (inline script reading localStorage, defaulting to
  `prefers-color-scheme`) so pages never flash the wrong theme, and pages remain readable
  with JavaScript disabled.

**Deploy & domain**

- R10. Deployment is a GitHub Actions workflow using `actions/upload-pages-artifact` (v3+)
  and `actions/deploy-pages` (v4+) with the required `permissions` block (`pages: write`,
  `id-token: write`, `contents: read`) — not `gh-pages` branch pushing.
- R11. The build output must include `.nojekyll` and a `CNAME` file containing
  `www.ajensen.org`, produced from files in the SvelteKit source tree (so a rebuild can
  never produce output that drops them).
- R12. `https://www.ajensen.org` serves the new site with no change to DNS records, and the
  GitHub Pages custom-domain setting on the repo is never unset during the migration.
- R13. Unknown URLs serve a styled 404 page (adapter-static `fallback: '404.html'`).
- R14. The old al-folio deploy machinery (`bin/deploy`, Docker workflows, `gh-pages` branch)
  is removed once the new pipeline is verified, so exactly one deploy path exists.

**Quality gates**

- R15. An RSS/Atom feed and a sitemap are generated at build time.
- R16. Each page has Open Graph meta tags (site currently has `serve_og_meta: false`, so this
  is an upgrade, not parity).
- R17. Every page and asset URL is prerendered — the adapter-static build fails if any route
  cannot be prerendered (loud failure over silent degradation).

**Information architecture & accessibility**

- R18. Primary navigation is a single level listing the six sections in a fixed order
  (Home, Publications, Projects, Talks, Blog, CV); the homepage leads with identity,
  current role, and links to the latest publications and the CV.
- R19. Every page is mobile-first and verified at common phone widths.
- R20. Interactive elements are keyboard operable; theme colors meet WCAG AA contrast;
  images carry alt text.

---

## Verified infra facts (cited, checked 2026-09-08)

- **`base` path**: SvelteKit docs say to set `config.kit.paths.base` to the repo name only
  when the site is served from a `username.github.io/<repo>` subpath. With a custom domain
  at the root, `base` stays empty. [svelte.dev/docs/kit/adapter-static, "GitHub Pages"
  section, retrieved 2026-09-08]
- **`.nojekyll`**: required so GitHub Pages skips Jekyll processing; without it Jekyll ignores
  SvelteKit's underscore-prefixed asset dirs (`_app/`) and the page loads with broken assets —
  a silent failure. It must exist in the *build output root*; the standard way is a file in
  SvelteKit's `static/` folder, which is copied verbatim into the output.
  [docs.github.com custom-domain/Pages docs; svelte adapter-static GH Pages guidance]
- **`CNAME`**: for branch-based publishing the file must sit at the root of the publishing
  source; with native Actions deployment GitHub does not read the file — the domain lives in
  repo Settings → Pages and survives. Keeping a `CNAME` in `static/` is still recommended as
  belt-and-braces and as an in-repo record of the domain.
  [docs.github.com/en/pages/…/troubleshooting-custom-domains-and-github-pages]
- **Actions deploy**: current pattern is `actions/configure-pages` + `upload-pages-artifact`
  + `deploy-pages`. Required permissions: `pages: write`, `id-token: write` (and
  `contents: read`). Older artifact action versions were deprecated for github.com
  (Dec 2024–Jan 2025); use `upload-pages-artifact@v3`+ / `deploy-pages@v4`+.
  [github.com/actions/deploy-pages README; github.blog changelog 2024-12-05]
- **404 / fallback**: `adapter({ fallback: '404.html' })` emits a client-routed shell that
  GitHub Pages serves for unknown URLs. If all routes are prerendered (our plan), the
  fallback is purely the 404 page. `trailingSlash` must be set once (`'always'` recommended
  for GH Pages directory-style URLs) and never mixed mid-migration, or links and the
  fallback interact badly. [svelte.dev/docs/kit/adapter-static; svelte.dev/docs/kit/
  single-page-apps]
- **RSS on a static build**: standard pattern is a prerendered route endpoint
  (`src/routes/rss.xml/+server.ts` with `export const prerender = true` and a `GET()`
  returning an XML `Response`) — the "server" route is materialized to a file at build time.
  [kylenazario.com full-content RSS post; baptiste.devessier.fr; matfantinel/sveltekit-static-
  blog-template]
- **BibTeX parsing**: `@retorquere/bibtex-parser` (v9, actively maintained, drives Better
  BibTeX for Zotero) parses `.bib` to structured JSON including LaTeX markup → unicode.
  Suitable for a build-time script. [retorque.re/bibtex-parser; npm registry]
- **Custom-domain breakage mode**: the documented failure is the `CNAME` file being
  overwritten/deleted by force-pushed generated output (branch publishing), or the domain
  setting being cleared. Moving to Actions-based deploy removes the force-push class
  entirely. [docs.github.com troubleshooting page]

---

## Footgun checklist

- **Domain setting cleared during source-mode switch** → GitHub falls back to
  `ajensen.github.io` and the custom domain silently stops serving → verify
  Settings → Pages still shows `www.ajensen.org` immediately after switching the source
  from branch to Actions, and never touch "Remove" on the custom domain.
- **Missing `.nojekyll`** → Jekyll processing skips `_app/*` assets; pages render but
  CSS/JS 404 (looks like a "broken redesign", easy to misdiagnose) → put `.nojekyll` in
  `static/`; verify the built output root contains it and that `/_app/…` asset URLs return 200.
- **Wrong `base` path** → copying a tutorial that sets `base: '/repo-name'` breaks every
  asset/link on a root custom domain → keep `base` unset/empty; verify homepage asset URLs
  are root-relative.
- **CNAME not in build output** → only matters if we ever fall back to branch publishing;
  keep `static/CNAME` so both modes work → verify `build/CNAME` exists post-build.
- **`trailingSlash` flip-flopping** → changing it after URLs are indexed causes duplicate or
  redirect-loop URLs → decide `trailingSlash: 'always'` up front and never change it.
- **Silent content skip** → forgetting the org→md export means a push deploys without the new
  post and nothing errors → build-time validation (R5): the build errors if an org file has
  no exported counterpart (or exports are checked in CI).
- **Old deploy paths left alive** → a stray `bin/deploy` run or old workflow pushes a stale
  `gh-pages` branch and, if Pages source is ever flipped, resurrects old content → delete
  `bin/deploy`, the Docker workflows, and the `gh-pages` branch at the end (R14).
- **HTTPS enforcement** → after the source-mode switch, confirm "Enforce HTTPS" is still on;
  mixed-content on the new site (http asset URLs) gets blocked by browsers.

---

## Feature parity gap list (what needs bespoke work)

- Publications from `.bib` with category sections + author formatting: **moderate**
  (build-time parse with `@retorquere/bibtex-parser`, render component).
- org-mode authoring (export command + markdown consumption + staleness check): **moderate**
  (mostly a small script + convention; ox-export mapping needs a defined frontmatter schema).
- RSS/Atom + sitemap: **trivial–moderate** (prerendered endpoint pattern, well documented).
- Per-page Open Graph tags: **moderate** (shared `<svelte:head>` helper; needs a default OG
  image — Andrew must supply one).
- Theme switching (dark/light, future themes): **trivial** (daisyUI built-in).
- Math rendering (al-folio had MathJax): **deferred** — only if Andrew writes math in posts
  (open question).
- CV page: **trivial** (structured data from `cv.bib`/existing CV content + a PDF link; the
  PDF already exists at `~/repo/resume-cv/resume.pdf`).

Dropped by decision (stock al-folio features not carried): Distill-style posts, Disqus/giscus,
masonry photo gallery, GitHub-stats `/repositories/` page, external-posts plugin,
hideCustomBibtex plugin.

---

## Proposed migration order

Infra first, content later — domain verified on a hello world before any design work:

1. **Snapshot current state**: record DNS records (`www` CNAME, apex A/ALIAS), Pages source
   setting, "Enforce HTTPS" state. (Read-only, no changes.)
2. **Scaffold** SvelteKit 2 + Svelte 5 + adapter-static + Tailwind 4 + daisyUI in a branch
   of `ajensen.org` with a hello-world home page; `static/` contains `.nojekyll` and `CNAME`.
3. **Deploy pipeline**: add the Actions workflow (R10); switch Pages source from branch to
   Actions; verify: minimal landing page live at `https://www.ajensen.org`, HTTPS enforced,
   custom domain still set, 404 page serves, no DNS changes were needed. The interim
   landing page replaces the current demo-placeholder site — an accepted trade-off, since
   the old content is stock al-folio demos. **Rollback path**: keep the `gh-pages` branch
   and al-folio files intact until step 8; if the Actions deploy misbehaves, flip Pages
   back to branch deploy (Settings → Pages → deploy from `gh-pages`) to restore the old
   site.
4. **Content skeleton**: content folders (R6), org→md export command + staleness check
   (R5), mdsvex wired up; publish one real test post.
5. **Data-driven pages**: publications from `cv.bib` (R2), projects and talks (R4), CV (R1).
6. **Polish**: RSS + sitemap (R15), OG tags (R16), theme toggle (R9), styled 404 (R13).
7. **Design pass**: this is where the fun starts — bespoke layout and theming on a working
   pipeline.
8. **Cleanup**: delete `bin/deploy`, Docker workflows, `gh-pages` branch, all Jekyll/
   al-folio files (R14); final end-to-end verification.

---

## Success Criteria

- `https://www.ajensen.org` serves the new SvelteKit site with zero DNS changes and zero
  domain downtime complaints; Google/other references to `www.ajensen.org` keep working.
- Andrew can publish by editing an org file, running the export command, and pushing —
  verified once end-to-end by Andrew himself.
- Andrew enjoys inspecting the codebase enough to start tweaking the theme (the actual
  "learn Svelte" outcome). Learning is built into the process: each migration step lands
  as an annotated commit with a short walkthrough of the Svelte idioms used, and the
  design pass (step 7) ends with a guided "first tweak" exercise Andrew performs himself.
- Exactly one deploy path exists; a fresh clone builds and deploys with no undocumented steps.

---

## Scope Boundaries

- No migration of al-folio demo content (posts, news, projects are placeholders and will be
  deleted, not redirected — no old permalinks to preserve).
- No comments system in v1 (can add giscus later if wanted).
- No redesign-first: infra and content pipeline land before bespoke design work.
- No server-side anything: fully static, GitHub Pages only.
- Math rendering, photo galleries, and other al-folio features: only if Andrew asks.

---

## Key Decisions

- **Greenfield SvelteKit rebuild, not a port**: repo content is stock demo material; porting
  it would preserve nothing of value. [repo scan + Andrew's confirmation]
- **Content imports**: publications from `~/repo/resume-cv/cv.bib` (already keyword-tagged);
  pages/posts from org files exported to markdown. [Andrew's authoring preference]
- **Manual ox-export command** over build-time org parsing or CI-side export: keeps the
  build pipeline 100% standard markdown — the no-footgun option. [Andrew's choice]
- **Tailwind 4 + daisyUI** over shadcn-svelte or plain CSS: built-in multi-theme switching
  matches "have fun with theming, add themes later"; zero markup lock-in. [Andrew's
  no-lock-in requirement]
- **Actions-native deploy** over `gh-pages` branch pushes: eliminates the CNAME-overwrite /
  force-push failure class entirely. [GitHub docs]
- **I build everything; Andrew inspects afterward.** [Andrew's choice]

---

## Dependencies / Assumptions

- Assumes `www.ajensen.org` DNS (CNAME → GitHub Pages) and the repo's Pages custom-domain
  setting are correctly configured today — they demonstrably serve the current site, and the
  plan requires no DNS changes. Apex-domain (`ajensen.org`) behavior unverified (open question).
- `cv.bib` and `resume.pdf` are vendored into this repo (CI cannot read `~/repo/resume-cv`).
  `~/repo/resume-cv/cv.bib` remains the upstream canonical source, continuously exported by
  Zotero; refreshing the vendored copy (copy + commit) is part of the publish flow (R5)
  whenever publications change.
- Andrew has Emacs + ox-md available for the export command (he already does this for LaTeX).

---

## Outstanding Questions

### Resolve Before Planning

- CV page (R1): default = link to the vendored `resume.pdf`, plus a simple structured-data
  rendering if trivial. Andrew can override at plan review. [Decision applied during review]
- Math rendering: default = not included in v1; add a mdsvex math plugin later if a post
  needs it. [Decision applied during review]

### Deferred to Planning

- [Affects R2][Needs research] Exact frontmatter schema for exported posts (title, date,
  tags, description) and the ox-md export mapping/template.
- [Affects R12][Needs research] Check whether `ajensen.org` (apex) currently resolves/redirects
  to `www` and whether any action is needed — read-only DNS check during migration step 1.
- [Affects R16][User decision] Default Open Graph image needs to be created at some point.

---

## Next Steps

-> `/ce-plan` for structured implementation planning.

---
module: ajensen.org SvelteKit rebuild (build/deploy + content pipeline)
date: 2026-09-08
problem_type: architecture_pattern
component: tooling
severity: medium
tags:
  - sveltekit
  - "github-pages"
  - "adapter-static"
  - bun
  - "org-mode"
  - mdsvex
  - bibtex
  - jj
title: "Greenfield SvelteKit static site on GitHub Pages: verified infra facts and dual-repo pipeline contracts"
applies_when:
  - migrating a Jekyll/GitHub-Pages site with a root custom domain to SvelteKit static
  - building an org-mode → markdown publishing pipeline with a build-time staleness gate
  - parsing a biblatex-flavored cv.bib at build time for a publications page
---

# Greenfield SvelteKit static site on GitHub Pages: verified infra facts and dual-repo pipeline contracts

## Context

Rebuilt ajensen.org from a stock al-folio Jekyll site to SvelteKit 2 + Svelte 5 +
`@sveltejs/adapter-static` on GitHub Pages with an existing root custom domain
(`www.ajensen.org`), bun as package manager, jj as VCS. Content pipeline: Emacs org-mode
posts manually exported to mdsvex markdown with a build-time staleness gate, and a
Zotero-exported `cv.bib` parsed at build time. Facts below were **verified against the
live toolchain** (2026-09-08), not copied from tutorials.

## Guidance

**GitHub Pages / adapter-static (root custom domain):**

- `paths.base` stays **empty** when a custom domain serves at the root. Only set it for
  `username.github.io/<repo>` subpath deployments.
- `static/.nojekyll` and `static/CNAME` are copied verbatim into the build output —
  every build self-heals both. Without `.nojekyll`, Pages' Jekyll pass hides the
  underscore-prefixed `_app/` dirs: pages render but CSS/JS 404 (silent, misdiagnosed
  as a "broken redesign").
- `fallback: '404.html'` **switches adapter-static into SPA-tolerant mode and mutes its
  strict all-routes-prerendered error**. Loud failure (build fails on unprerendered
  routes/dead links) comes from the prerenderer's default `handleError`/`handleHttpError:
  'fail'` — keep those defaults, and verify route coverage in CI (smoke-check each nav
  route after deploy) because the adapter's own check is gone.
- `trailingSlash: 'always'` matches Pages' directory-style serving; decide once, never
  flip after URLs are indexed.
- Actions-native deploy kills the branch-publish CNAME-overwrite failure class entirely.
  Verified current majors: `actions/checkout@v7`, `actions/configure-pages@v6`,
  `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`; required permissions:
  `contents: read`, `pages: write`, `id-token: write`. Flip Settings → Pages source to
  "GitHub Actions" **before** the first push or `deploy-pages` fails with a
  Pages-configuration error.
- Apex and www: if the cert already covers both (`https_certificate.domains` in the
  Pages API), the apex is not a dead origin — no DNS work needed.

**Toolchain pins (verified via npm registry):**

- Kit 2.70's Vite peer range is `^5 || ^6 || ^8` — it **skips Vite 7**. The current
  combo is Vite 8 + `@sveltejs/vite-plugin-svelte` 7 + Node 22.
- mdsvex ≥ 0.12.7 required for Svelte ≥ 5.53 (0.12.6 crashes in `extract_parts`).
  Open issue #738: runes inside `.md`/`.svx` **with mdsvex `layout:`** throw
  "Context is missing" — keep markdown content-only; runes live in `.svelte` layouts,
  which must still use `export let` + `<slot />` (mdsvex wraps content in a slot).
- `@retorquere/bibtex-parser` v10: **`keywords` arrives as a string ARRAY even when
  listed in `verbatimFields`** — coerce arrays before comma-splitting. Authors arrive
  as `Creator[]` (`{firstName, lastName}`, LaTeX already decoded to unicode); the biblatex
  `date` field (e.g. `2023-05`) is a plain string — regex the year out.
- Emacs `org-collect-keywords` returns some keywords (e.g. `FILETAGS`) as **lists**, not
  strings — coerce with `(if (consp v) (string-join v " ") v)` or `split-string` crashes.
- Svelte MCP works headless via CLI: `bunx @sveltejs/mcp list-sections`,
  `... get-documentation <paths>`, `... svelte-autofixer <file>` (loop until clean).

**Dual-implementation hash contract (org → md staleness gate):**

- The gate compares a sha256 of the whole org file (whitespace-normalized) against
  `org_hash` stamped in the markdown frontmatter at export time. The normalization
  must be byte-identical across the elisp exporter and the TS checker. The trick that
  makes this safe: UTF-8 multibyte sequences never contain space/tab/newline bytes, so
  elisp can hash raw **bytes** (`insert-file-contents-literally` + unibyte buffer +
  `secure-hash`) while the TS side hashes decoded **characters** — identical results.
- mtimes must never be consulted (fresh clones invalidate them). The gate must be
  bidirectional: missing md = fail, orphan md (no org) = fail, missing frontmatter =
  fail, hash mismatch = fail with the file named and the fix printed.
- Run the gate as the first step inside `build` (`bun scripts/check-content.ts &&
  vite build`), not as an npm-style `prebuild` hook — `bun run` does not reliably
  honor pre/post script hooks.

## Why This Matters

Every one of these was a real or near-miss bug during the rebuild: the keywords-array
shape would have silently emptied the publications page; the FILETAGS list shape crashed
the exporter on first run; treating the fallback as the loud-failure mechanism would have
made broken deploys invisible. The dual-side hash contract is the kind of thing that
breaks three months later on a fresh clone if the two normalizations drift.

## When to Apply

When touching this repo's build/deploy/content pipeline, or when doing the same
migration shape (Jekyll/GH Pages + custom domain → SvelteKit static; org-mode
publishing; build-time BibTeX) elsewhere.

## Examples

- Byte-safe hash normalization, elisp side:
  ```elisp
  (set-buffer-multibyte nil)
  (insert-file-contents-literally path)   ; raw bytes
  (secure-hash 'sha256 normalized-bytes)  ; == TS sha256(utf8-decoded text)
  ```
- keywords coercion, TS side:
  ```ts
  if (Array.isArray(value) && value.every(v => typeof v === 'string'))
    return value.join(',');  // parser returns ["publication"] even with verbatimFields
  ```
- Post metadata without instantiating components:
  ```ts
  import.meta.glob('/src/content/posts/*.md', { eager: true, import: 'metadata' })
  ```

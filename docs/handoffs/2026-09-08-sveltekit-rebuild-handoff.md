---
date: 2026-09-08
topic: sveltekit-rebuild-handoff
status: in-progress
plan: docs/plans/2026-09-08-001-feat-sveltekit-rebuild-plan.md
requirements: docs/brainstorms/2026-09-08-sveltekit-rebuild-ajensen-org-requirements.md
---

# Handoff: ajensen.org SvelteKit rebuild (U1–U3 done, U4 ~90%)

Read the plan first — it is the source of truth for every unit. Context for why things
are the way they are: `docs/brainstorms/…-requirements.md` (R1–R20) and the verified
facts learning in `docs/solutions/architecture-patterns/`.

## State

- **U1 ✅ committed** — SvelteKit scaffold (build green, `.nojekyll`/`CNAME` in `build/`).
- **U2 ✅ committed (code side)** — Actions workflow + README runbook. **Andrew's manual
  cutover not yet done** (below).
- **U3 ✅ committed** — org→md pipeline + staleness gate (fixtures tested, exit-1 paths
  verified; export round-trip green).
- **U4 🔨 ~90%, uncommitted in working copy** — `cv.bib` vendored + classified (30
  entries: 5 publication / 6 invited-talk / 19 presentation; compound
  `exactech,presentation` correctly lands presentation-only), publications + talks pages
  written. **Remaining for U4:** run `bun run check && bun run build`, resolve one
  svelte-autofixer flag (see Gotchas #2), delete nothing left over, commit
  (`jj squash` pattern used for U3 fixes — see Gotchas #3).
- **U5–U8** untouched; follow the plan units in order. U7 needs Andrew's participation
  (guided first-tweak). U8 needs the rollback verification before deleting `gh-pages`.

## Andrew's manual cutover (in this exact order)

1. `gh api -X PUT repos/ajensen1234/ajensen.org/pages -f build_type=workflow`
   (flip Pages source BEFORE any push, or the first deploy fails)
2. `jj bookmark set master -r @` then `jj git push`
3. Watch the workflow: build → verify → deploy → smoke-check (homepage + `_app` asset +
   404). Then verify `https://www.ajensen.org` serves the landing page with domain +
   HTTPS intact. Full runbook in `README.md`.

## Gotchas (learned the hard way this session)

1. **jj**: `jj split`/`jj squash` need `-m` or they open editors and hang. Use
   `jj commit -m`, `jj describe -m`, `jj squash --from X --into Y -m`, `jj split <paths> -m`.
   Never `jj ci`, `--amend`, bare `jj split`, or `jj move`.
2. **svelte-autofixer external-href rule**: it flags any `href` it can't prove absolute
   (`href={entry.url}` → "Unexpected href link without resolve()"). External links
   **cannot** use `resolve()` (it throws on absolute URLs). Proven-external inline
   template literals (`href={`https://doi.org/${doi}`}`) pass. Decide per link: inline
   construct the URL, or document the false positive. Rule only fires in-project
   (`/tmp` test files bypass kit config — test inside the repo).
3. **bash + `.org`-path guard**: bash commands that rm/append/overwrite any path
   containing `.org` (including the repo dir name) are blocked — use the edit/write
   tools for such files, relative paths for `rm` of other files.
4. **bibtex-parser v10**: `keywords` arrives as a string ARRAY even with
   `verbatimFields` (coercion already in `src/lib/server/bibtex.ts` — don't remove).
5. **mdsvex**: markdown is content-only (runes in `.md` + `layout:` throws — issue
   #738). Post metadata via `import.meta.glob(..., { import: 'metadata' })`; frontmatter
   keys are snake_case (`org_hash`).
6. **bun**: no pre/post script hooks — the staleness gate runs as the first step inside
   `build` itself. Svelte MCP not yet connected as native tools (registered in
   `~/.config/mcp/mcp.json`; needs session restart) — meanwhile use
   `bunx @sveltejs/mcp <tool>`.

## Environment

- bun 1.4.2, node 22, emacs available (batch export verified working)
- `bun run check` must stay at 0 errors before committing anything
- Commits carry a short Svelte-idioms walkthrough note (origin learn-Svelte criterion)

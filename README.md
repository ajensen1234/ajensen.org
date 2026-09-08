# ajensen.org

Personal site of Andrew Jensen — SvelteKit 2 + Svelte 5, Tailwind CSS 4 + daisyUI 5,
statically built with `@sveltejs/adapter-static` and deployed to GitHub Pages
(`www.ajensen.org`) by GitHub Actions.

## Quickstart

```sh
bun install
bun run dev        # dev server
bun run check      # svelte-check (must stay at 0 errors)
bun run build      # staleness gate + prerender → build/
bun run preview    # serve build/
```

Requires bun (everything, including CI, uses bun — not npm).

## Publishing content

**Posts (org mode):** edit `src/content/posts/<slug>.org`, export with
`M-x aj-export-post` (or the batch command in `docs/content-authoring.md`),
commit both the `.org` and exported `.md`. The build **fails loudly** if an
export is missing or stale — never hand-edit the `.md`.

**Publications & talks:** refresh `src/data/cv.bib` from your Zotero export
(`~/repo/resume-cv/cv.bib`), never hand-edit the vendored copy.

**Projects & CV:** edit `src/content/projects/*.md` and `src/data/cv.md`
(schemas in `docs/content-authoring.md`).

Full authoring contract: **[docs/content-authoring.md](docs/content-authoring.md)**.

## Deploy & rollback runbook

Pushing to `master` triggers the workflow (`.github/workflows/deploy.yml`):
`bun run check && bun run build` → verify build output (`.nojekyll`, `CNAME`,
`404.html`) → deploy → smoke-check the live site (every nav route, one `_app/`
asset, 404 behavior).

**Rollback:**

- *Any time:* re-run a previous green workflow run (Actions tab → run → Re-run all
  jobs). A re-run rebuilds from the recorded commit — it must still be reachable.
- *Retired:* flipping Pages source back to the `gh-pages` branch was only a
  migration-window option and is gone now that `gh-pages` is deleted.

**Never** unset the custom domain (Settings → Pages → custom domain = `www.ajensen.org`)
or turn off "Enforce HTTPS".

**First deploy from a fresh clone:** Settings → Pages → Source = "GitHub Actions"
must be set before pushing (it already is for this repo).

## Vendored files — one habit

`cv.bib` and `resume.pdf` refresh together: re-export from Zotero / rebuild the
LaTeX CV (`~/repo/resume-cv/`), copy both into the repo, commit once.

## Comments (removed in v1, re-add later)

giscus was configured on the old al-folio site; the personalized config is preserved
here for a future re-add:

```yaml
giscus:
  repo: ajensen1234/ajensen.org
  repo_id: MDEwOlJlcG9zaXRvcnk2MDAyNDM2NQ==
  category: Comments
  category_id: DIC_kwDOA5PmLc4CTBt6
  mapping: title
  strict: 1
  reactions_enabled: 1
  input_position: bottom
```

Wire it into a post-page component with the giscus web component when wanted.

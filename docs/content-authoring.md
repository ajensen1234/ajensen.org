# Content authoring

How posts, publications, projects, and CV data get into the site. Day-to-day
publishing is: **edit an org file → export → commit → push.** Nothing else.

## Posts (org mode)

- `src/content/posts/<slug>.org` is the source of truth; `<slug>.md` is its
  exported artifact. **Both are committed.**
- Org keywords: `#+TITLE`, `#+DATE` (required — dates come from the keyword,
  never the clock), `#+DESCRIPTION` (feeds OG tags; falls back to a site
  default if absent), `#+FILETAGS: :tag1:tag2:`.

### Exporting

From Emacs, with the .org file open: `M-x aj-export-post`.
Batch: `emacs --batch -l scripts/aj-export-post.el --eval '(aj-export-post "src/content/posts/<slug>.org")'`

The export writes the sibling `.md` with frontmatter and stamps `org_hash` —
the sha256 of the whole org file, whitespace-normalized.

### Staleness gate (why you can't forget to export)

`bun run build` runs `scripts/check-content.ts` first. The build **fails** if:

| Problem | Meaning | Fix |
|---|---|---|
| `.md` absent | org file never exported | run the export |
| `org_hash` mismatch | org file edited after last export (stale) | run the export |
| `.md` orphan | org source deleted but markdown left behind | delete the `.md` or restore the `.org` |
| missing frontmatter | required `title`/`date`/`org_hash` absent | run the export |

mtimes are never consulted, so fresh clones behave identically to your
machine. The error message names the offending file and the fix.

Run the check locally before pushing: `bun run check-content` (it's also the
first step of `bun run build`).

> If you change `scripts/aj-export-post.el`'s export behavior, bump a version
> string into the hash input in **both** the elisp and
> `scripts/check-content.ts` — otherwise old exports pass the new gate.

## Publications & talks (cv.bib)

- `src/data/cv.bib` is **vendored** — CI cannot read `~/repo/resume-cv`.
- Upstream is your Zotero export at `~/repo/resume-cv/cv.bib`. To update:
  refresh the vendored copy and commit (part of the normal publish flow).
- **Never hand-edit the vendored `cv.bib`** — a later refresh silently reverts
  hand fixes. Fix the entry in Zotero, re-export, re-copy.
- Categories: entries carry `keywords` from the set `publication`,
  `invited-talk`, `presentation` (compound values are comma-split). An entry
  matching none of them **fails the build** — curate tags upstream, never
  silently drop content.
- Talk links: `url` field = paper link, `note` field = slides/video.

## Projects

- One data file per project in `src/content/projects/` (schema: `title`,
  `period`, `summary`, `role`, `links`, `highlight`). Adding a project is
  editing one file; a malformed file fails the build.

## CV

- The CV page's Education/Positions YAML is a **hand-maintained mirror** of
  `static/resume.pdf` — keep it to a one-screen summary and re-verify against
  the PDF on each edit (the PDF is vendored from `~/repo/resume-cv/resume.pdf`).

## Vendored files — one habit

`cv.bib`, `resume.pdf` refresh together: re-export from Zotero / rebuild the
LaTeX CV, copy both into the repo, commit once. That single habit is the only
maintenance the static content needs.

---
title: Hello, world
date: 2026-09-08
description: First post on the rebuilt site — and the shakedown run of the org-mode publishing pipeline.
tags: ["meta"]
org_hash: 723df3265f782ae1288349d0783590957d52d012190c993f249851c781ed33b6
---

This is the first post on the rebuilt site.

The publishing flow is intentionally boring:

1.  Write an org file in `src/content/posts/`.
2.  Run `M-x aj-export-post` from the org buffer.
3.  Commit and push.

If the exported markdown is missing or stale, the build fails loudly
instead of silently publishing old content — that check runs on every
push, both locally and in CI.

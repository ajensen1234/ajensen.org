// Post metadata — the single source of truth consumed by the blog index (U6),
// RSS (U6), and the sitemap (U6). Slugs and dates are NEVER duplicated elsewhere.
//
// Posts are content-only markdown (no runes — mdsvex #738); all Svelte logic
// lives in .svelte layouts/components.

export interface PostMeta {
	slug: string;
	title: string;
	/** ISO date string from the org #+DATE keyword (never the clock). */
	date: string;
	description?: string;
	tags: string[];
	/** sha256 of the source .org file — stamped at export, verified at build (R5). */
	orgHash: string;
}

// mdsvex parses YAML frontmatter into a `metadata` named export on each compiled
// .md module. `import: 'metadata'` grabs only the metadata without instantiating
// components in the consumer's bundle. Frontmatter keys are snake_case
// (org_hash), matching scripts/aj-export-post.el verbatim.
interface RawMeta {
	title?: unknown;
	date?: unknown;
	description?: unknown;
	tags?: unknown;
	org_hash?: unknown;
}

const modules = import.meta.glob('/src/content/posts/*.md', {
	eager: true,
	import: 'metadata'
}) as Record<string, RawMeta | undefined>;

/** mdsvex embeds frontmatter via JSON.stringify, so js-yaml-parsed dates
 * arrive as ISO timestamps ("2026-09-08T00:00:00.000Z"), not the exported
 * "YYYY-MM-DD". Normalize to the plain date for everything downstream. */
function asIsoDate(value: unknown): string | undefined {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
	return undefined;
}

export const posts: PostMeta[] = Object.entries(modules)
	.flatMap(([path, meta]) => {
		const slug = path.split('/').pop()?.replace(/\.md$/, '');
		const date = asIsoDate(meta?.date);
		// A post that made it past scripts/check-content.ts always has these;
		// anything malformed here was already rejected loudly at build start.
		if (!slug || typeof meta?.title !== 'string' || !date) {
			return [];
		}
		return [
			{
				slug,
				title: meta.title,
				date,
				description: typeof meta.description === 'string' ? meta.description : undefined,
				tags: Array.isArray(meta.tags)
					? meta.tags.filter((t): t is string => typeof t === 'string')
					: [],
				orgHash: typeof meta.org_hash === 'string' ? meta.org_hash : ''
			}
		];
	})
	// Newest first; ISO dates sort lexicographically.
	.sort((a, b) => b.date.localeCompare(a.date));

// Build-time project loading (R4). One data file per project in
// src/content/projects/ — adding a project is adding a file, no code edits.
// Malformed project files are BUILD ERRORS naming the file (content is never
// silently dropped).
export interface ProjectLink {
	label: string;
	url: string;
}

export interface Project {
	/** File stem, also the deterministic tiebreak key. */
	slug: string;
	title: string;
	/** Human-readable period, e.g. "April 2024 – present". */
	period: string;
	/** ISO-ish sort key, e.g. "2024-04". */
	periodStart: string;
	role: string;
	summary: string;
	links: ProjectLink[];
	highlight: boolean;
}

// mdsvex parses YAML frontmatter into a `metadata` named export (same
// mechanism as posts.ts). Project files are frontmatter-only; camelCase keys
// are fine here — no elisp exporter is involved.
interface RawProject {
	title?: unknown;
	period?: unknown;
	periodStart?: unknown;
	role?: unknown;
	summary?: unknown;
	links?: unknown;
	highlight?: unknown;
}

const modules = import.meta.glob('/src/content/projects/*.md', {
	eager: true,
	import: 'metadata'
}) as Record<string, RawProject | undefined>;

function fail(path: string, problem: string): never {
	throw new Error(
		`Project file ${path}: ${problem}. Fix the frontmatter and rebuild — ` +
			`content is never silently dropped.`
	);
}

function asString(path: string, field: string, value: unknown): string {
	if (typeof value === 'string' && value.trim() !== '') return value.trim();
	fail(path, `missing or empty required frontmatter field "${field}"`);
}

function asLinks(path: string, value: unknown): ProjectLink[] {
	if (value === undefined) return [];
	if (!Array.isArray(value)) fail(path, '"links" must be a list of { label, url }');
	return value.map((raw, i) => {
		if (typeof raw !== 'object' || raw === null) {
			fail(path, `links[${i}] must be an object with "label" and "url"`);
		}
		const link = raw as { label?: unknown; url?: unknown };
		if (typeof link.label !== 'string' || typeof link.url !== 'string' || link.url === '') {
			fail(path, `links[${i}] must have string "label" and non-empty string "url"`);
		}
		return { label: link.label, url: link.url };
	});
}

export const projects: Project[] = Object.entries(modules)
	.flatMap(([path, meta]) => {
		const slug = path.split('/').pop()?.replace(/\.md$/, '');
		if (!slug || !meta) {
			throw new Error(`Project file ${path}: unreadable metadata`);
		}
		return [
			{
				slug,
				title: asString(path, 'title', meta.title),
				period: asString(path, 'period', meta.period),
				periodStart: asString(path, 'periodStart', meta.periodStart),
				role: asString(path, 'role', meta.role),
				summary: asString(path, 'summary', meta.summary),
				links: asLinks(path, meta.links),
				highlight: meta.highlight === true
			}
		];
	})
	// Highlighted first, then newest-starting; slug tiebreak keeps the order
	// deterministic across re-exports.
	.sort(
		(a, b) =>
			Number(b.highlight) - Number(a.highlight) ||
			b.periodStart.localeCompare(a.periodStart) ||
			a.slug.localeCompare(b.slug)
	);

export const highlightedProjects: Project[] = projects.filter((p) => p.highlight);

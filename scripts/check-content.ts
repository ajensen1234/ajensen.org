/**
 * Content staleness gate (R5). Runs as the first step of `bun run build`.
 *
 * Contract (see docs/content-authoring.md):
 *  - Every post is an org file (src/content/posts/<slug>.org) plus its exported
 *    markdown (<slug>.md).
 *  - The export stamps `org_hash` into the markdown frontmatter: the sha256 of
 *    the WHOLE org file, whitespace-normalized (trailing whitespace stripped
 *    per line, leading/trailing blank lines trimmed). The same normalization
 *    lives in scripts/aj-export-post.el — keep the two in sync.
 *  - mtimes are never consulted (fresh clones invalidate them).
 *
 * Fails loudly (exit 1) when:
 *  - an org file has no exported markdown (absent export)
 *  - a markdown file has no org file (orphan)
 *  - required frontmatter is missing (title, date, org_hash)
 *  - the recomputed hash does not match the stamped hash (stale export)
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CONTENT_DIR = join(import.meta.dir, '..', 'src', 'content', 'posts');
const REQUIRED_FIELDS = ['title', 'date', 'org_hash'] as const;

/** Mirrors the normalization in aj-export-post.el (aj--normalize-for-hash). */
function normalize(text: string): string {
	return text
		.split('\n')
		.map((line) => line.replace(/[ \t]+$/, ''))
		.join('\n')
		.replace(/^\n+/, '')
		.trimEnd();
}

function sha256(text: string): string {
	return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Minimal frontmatter reader: the first `---`-fenced YAML block, `key: value` lines. */
function readFrontmatter(md: string): Record<string, string> {
	const match = /^---\r?\n(.*?)\r?\n---\r?\n/s.exec(md);
	const meta: Record<string, string> = {};
	if (!match) return meta;
	for (const line of match[1].split('\n')) {
		const kv = /^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/.exec(line);
		if (kv) meta[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '');
	}
	return meta;
}

function fail(messages: string[]): never {
	console.error(`\n✗ Content check failed (${messages.length} problem${messages.length === 1 ? '' : 's'}):\n`);
	for (const m of messages) console.error(`  • ${m}`);
	console.error('\nFix: re-run the export for the affected file(s):');
	console.error('  M-x aj-export-post   (in Emacs, from the .org file)');
	console.error('  or: emacs --batch -l scripts/aj-export-post.el --eval \'(aj-export-post "src/content/posts/<slug>.org")\'\n');
	process.exit(1);
}

const entries = readdirSync(CONTENT_DIR);
const orgs = entries.filter((f) => f.endsWith('.org')).map((f) => f.replace(/\.org$/, ''));
const mds = entries.filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));

const problems: string[] = [];

for (const slug of orgs) {
	if (!mds.includes(slug)) {
		problems.push(`"${slug}.md" is absent (org file exists but was never exported)`);
		continue;
	}
	const org = readFileSync(join(CONTENT_DIR, `${slug}.org`), 'utf8');
	const md = readFileSync(join(CONTENT_DIR, `${slug}.md`), 'utf8');
	const meta = readFrontmatter(md);

	for (const field of REQUIRED_FIELDS) {
		if (!meta[field]) problems.push(`"${slug}.md" frontmatter is missing required field "${field}"`);
	}
	if (meta.org_hash && meta.org_hash !== sha256(normalize(org))) {
		problems.push(
			`"${slug}.md" is STALE (org_hash mismatch — the .org file changed after the last export)`
		);
	}
}

for (const slug of mds) {
	if (!orgs.includes(slug)) {
		problems.push(`"${slug}.md" is an ORPHAN (no matching .org file — delete it or restore the org source)`);
	}
}

if (problems.length > 0) fail(problems);

console.log(`✓ Content check passed (${orgs.length} post${orgs.length === 1 ? '' : 's'}, all exports fresh).`);

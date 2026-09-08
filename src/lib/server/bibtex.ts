// Build-time BibTeX parsing and classification (R2/R4). Runs during prerender
// via +page.server.ts loads — never shipped to the browser.
//
// Contract (docs/content-authoring.md):
//  - categories come from comma-split `keywords` (verbatim field)
//  - an entry matching NONE of the categories is a BUILD ERROR naming the
//    citekey — content is never silently dropped
//  - a multi-category entry renders in all matching sections
//  - a malformed bib file is a BUILD ERROR (never an empty page)
import { parse } from '@retorquere/bibtex-parser';
import bibText from '../../data/cv.bib?raw';

export type Category = 'publication' | 'invited-talk' | 'presentation';

export const CATEGORIES: Category[] = ['publication', 'invited-talk', 'presentation'];

export interface Author {
	firstName?: string;
	lastName?: string;
	fullName: string;
}

export interface Entry {
	key: string;
	title: string;
	authors: Author[];
	year: number;
	date: string;
	/** journaltitle for publications, eventtitle for talks. */
	venue?: string;
	/** venue field (talks): location. */
	location?: string;
	doi?: string;
	url?: string;
	/** `note` field — talk slides/video links per the link convention. */
	note?: string;
	categories: Category[];
}

const CATEGORIES_SET = new Set<string>(CATEGORIES);

// biome-ignore lint/suspicious/noExplicitAny: parser v10's Entry type is structural but over-narrow for our needs
type ParserEntry = {
	key: string;
	fields: Record<string, unknown>;
};

function asString(value: unknown): string | undefined {
	if (typeof value === 'string' && value.trim() !== '') return value.trim();
	// The parser returns some verbatim fields (e.g. keywords) as string arrays.
	if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
		const joined = (value as string[]).join(',').trim();
		return joined !== '' ? joined : undefined;
	}
	return undefined;
}

function toAuthors(value: unknown): Author[] {
	// creatorlist fields arrive as Creator[]: { firstName?, lastName?, … }
	if (!Array.isArray(value)) return [];
	return value
		.map((c): Author | null => {
			if (typeof c !== 'object' || c === null) return null;
			const creator = c as { firstName?: string; lastName?: string; name?: string };
			const fullName =
				[creator.firstName, creator.lastName].filter(Boolean).join(' ').trim() ||
				(typeof creator.name === 'string' ? creator.name : '');
			if (!fullName) return null;
			return {
				firstName: creator.firstName,
				lastName: creator.lastName,
				fullName
			};
		})
		.filter((a): a is Author => a !== null);
}

function parseCategories(rawKeywords: unknown, key: string): Category[] {
	const keywords = asString(rawKeywords) ?? '';
	const split = keywords
		.split(',')
		.map((k) => k.trim().toLowerCase())
		.filter(Boolean);
	const matched = split.filter((k): k is Category => CATEGORIES_SET.has(k));
	if (matched.length === 0) {
		throw new Error(
			`cv.bib entry "${key}" has no recognized keywords (found: "${keywords || 'none'}"). ` +
				`Expected at least one of: ${CATEGORIES.join(', ')}. ` +
				`Fix the tags in Zotero and re-export — content is never silently dropped.`
		);
	}
	return matched;
}

function parseYear(date: unknown, key: string): number {
	const yearMatch = /(\d{4})/.exec(asString(date) ?? '');
	if (!yearMatch) throw new Error(`cv.bib entry "${key}" has no parseable date`);
	return Number.parseInt(yearMatch[1], 10);
}

function buildEntry(entry: ParserEntry): Entry {
	const { key, fields } = entry;
	const categories = parseCategories(fields.keywords, key);
	return {
		key,
		title: asString(fields.title) ?? '(untitled)',
		authors: toAuthors(fields.author),
		year: parseYear(fields.date, key),
		date: asString(fields.date) ?? '',
		venue: asString(fields.journaltitle) ?? asString(fields.eventtitle),
		location: asString(fields.venue),
		doi: asString(fields.doi),
		url: asString(fields.url),
		note: asString(fields.note),
		categories
	};
}

const library = parse(bibText, {
	// Keep raw strings (no case mangling) for fields we classify or link on.
	verbatimFields: ['keywords', 'url', 'doi', 'note', 'file']
});

if (library.errors.length > 0) {
	throw new Error(
		`cv.bib failed to parse (${library.errors.length} error${library.errors.length === 1 ? '' : 's'}):\n` +
			library.errors.map((e) => `  • ${String(e)}`).join('\n')
	);
}

export const entries: Entry[] = library.entries.map(buildEntry).sort(
	(a, b) => b.year - a.year || a.key.localeCompare(b.key)
);

export function inCategory(category: Category): Entry[] {
	return entries.filter((e) => e.categories.includes(category));
}

export const publications: Entry[] = inCategory('publication');
export const invitedTalks: Entry[] = inCategory('invited-talk');
export const presentations: Entry[] = inCategory('presentation');

/** All talk-like entries (both categories), merged chronologically — newest first. */
export const talks: Entry[] = entries
	.filter((e) => e.categories.includes('invited-talk') || e.categories.includes('presentation'))
	.sort((a, b) => b.year - a.year || a.key.localeCompare(b.key));

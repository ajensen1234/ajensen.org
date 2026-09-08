// Build-time CV data loading (R1). src/data/cv.md is a hand-maintained mirror
// of the LaTeX CV; its frontmatter carries the whole one-screen summary.
// Array order in the frontmatter IS the display order — no sorting here.
export interface CvItem {
	school?: string;
	org?: string;
	location?: string;
	title?: string;
	degree?: string;
	period: string;
	details: string[];
}

export interface CvData {
	education: CvItem[];
	positions: CvItem[];
}

interface RawCv {
	education?: unknown;
	positions?: unknown;
}

const modules = import.meta.glob('/src/data/cv.md', {
	eager: true,
	import: 'metadata'
}) as Record<string, RawCv | undefined>;

function fail(problem: string): never {
	throw new Error(
		`src/data/cv.md: ${problem}. Fix the frontmatter and rebuild — content is ` +
			`never silently dropped.`
	);
}

function asItems(field: 'education' | 'positions', value: unknown): CvItem[] {
	if (!Array.isArray(value) || value.length === 0) {
		fail(`"${field}" must be a non-empty list`);
	}
	return value.map((raw, i) => {
		if (typeof raw !== 'object' || raw === null) {
			fail(`${field}[${i}] must be an object`);
		}
		const item = raw as Record<string, unknown>;
		if (typeof item.period !== 'string' || item.period.trim() === '') {
			fail(`${field}[${i}] is missing "period"`);
		}
		const details = Array.isArray(item.details)
			? item.details.filter((d): d is string => typeof d === 'string')
			: [];
		const out: CvItem = { period: item.period, details };
		for (const key of ['school', 'org', 'location', 'title', 'degree'] as const) {
			if (typeof item[key] === 'string') out[key] = item[key];
		}
		return out;
	});
}

export const cv: CvData = (() => {
	const meta = Object.values(modules)[0];
	if (!meta) fail('unreadable metadata');
	return {
		education: asItems('education', meta.education),
		positions: asItems('positions', meta.positions)
	};
})();

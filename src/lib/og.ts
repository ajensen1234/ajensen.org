// Open Graph tag builder (R16). Universal module — every page's <svelte:head>
// consumes it via Seo.svelte. All URLs derive from SITE_URL in site.ts.
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '$lib/site';

export interface OgInput {
	title: string;
	/** Falls back to the site-level description — og:description is never empty. */
	description?: string;
	/** Page path with trailing slash, e.g. `/blog/my-post/`; omit for home. */
	path?: string;
	/** Absolute URL or site-rooted path; defaults to /og-default.png. */
	image?: string;
	type?: 'website' | 'article';
}

export function buildOg(input: OgInput): Record<string, string> {
	const absolute = (image: string) =>
		image.startsWith('http') ? image : `${SITE_URL}${image}`;
	return {
		'og:site_name': SITE_TITLE,
		'og:title': input.title,
		'og:description': input.description?.trim() ? input.description : SITE_DESCRIPTION,
		'og:url': `${SITE_URL}${input.path ?? '/'}`,
		'og:type': input.type ?? 'website',
		'og:image': absolute(input.image ?? '/og-default.png')
	};
}

import { posts } from '$lib/server/posts';
import { SITE_URL } from '$lib/site';
import type { RequestHandler } from './$types';

// Truthful sitemap (R15): every canonical route + each post. <lastmod> comes
// from post dates ONLY — never the build clock, so redeploys don't fake
// freshness. Add a line here when a new static route lands.
export const prerender = true;

const STATIC_ROUTES = ['', 'blog/', 'publications/', 'projects/', 'talks/', 'cv/'];

function entry(path: string, lastmod?: string): string {
	return [
		'	<url>',
		`		<loc>${SITE_URL}/${path}</loc>`,
		lastmod ? `		<lastmod>${lastmod}</lastmod>` : null,
		'	</url>'
	]
		.filter((line) => line !== null)
		.join('\n');
}

export const GET: RequestHandler = async () => {
	const lines: string[] = [];
	// The blog index's lastmod is its newest post (no posts → no lastmod).
	const newest = posts[0]?.date;
	for (const route of STATIC_ROUTES) {
		lines.push(entry(route, route === 'blog/' ? newest : undefined));
	}
	for (const post of posts) {
		lines.push(entry(`blog/${post.slug}/`, post.date));
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${lines.join('\n')}
</urlset>
`;

	return new Response(xml, {
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};

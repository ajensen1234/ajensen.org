import { render } from 'svelte/server';
import { posts } from '$lib/server/posts';
import { SITE_TITLE, SITE_URL } from '$lib/site';
import type { RequestHandler } from './$types';

// RSS 2.0 with FULL rendered HTML content (R15). mdsvex compiles each post to
// a component at build; svelte/server renders it to an HTML string here —
// all prerender-time, never at request time.
const modules = import.meta.glob('/src/content/posts/*.md') as Record<
	string,
	() => Promise<{ default: import('svelte').Component }>
>;

const MAX_ITEMS = 20;

function escapeXml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const prerender = true;

export const GET: RequestHandler = async () => {
	const items: string[] = [];
	for (const post of posts.slice(0, MAX_ITEMS)) {
		const loader = modules[`/src/content/posts/${post.slug}.md`];
		let content = '';
		if (loader) {
			// A post that passed the staleness gate always resolves; a failed
			// module would have already failed the build elsewhere.
			const mod = await loader();
			content = render(mod.default as Parameters<typeof render>[0], { props: {} }).body;
		}
		const url = `${SITE_URL}/blog/${post.slug}/`;
		items.push(
			[
				'	<item>',
				`		<title>${escapeXml(post.title)}</title>`,
				`		<link>${url}</link>`,
				// isPermaLink=true: the guid IS the canonical URL (matches the page).
				`		<guid isPermaLink="true">${url}</guid>`,
				`		<pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>`,
				post.description ? `		<description>${escapeXml(post.description)}</description>` : null,
				`		<content:encoded><![CDATA[${content}]]></content:encoded>`,
				'	</item>'
			]
				.filter((line) => line !== null)
				.join('\n')
		);
	}

	// Valid XML even with zero posts (empty channel).
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
	<channel>
		<title>${escapeXml(SITE_TITLE)}</title>
		<link>${SITE_URL}/</link>
		<description>${escapeXml(`${SITE_TITLE} — blog`)}</description>
		<lastBuildDate>${items.length > 0 ? new Date(`${posts[0].date}T00:00:00Z`).toUTCString() : new Date(0).toUTCString()}</lastBuildDate>
${items.join('\n')}
	</channel>
</rss>
`;

	return new Response(xml, {
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};

import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Component resolution lives in the UNIVERSAL load: it re-runs on the client
// during hydration, so the component itself never crosses the serialization
// boundary (a server load result must stay JSON-serializable).
const modules = import.meta.glob('/src/content/posts/*.md') as Record<
	string,
	() => Promise<{ default: import('svelte').Component }>
>;

export const load: PageLoad = async ({ data }) => {
	console.log('UNIVERSAL LOAD data keys:', Object.keys(data ?? {}), 'post:', JSON.stringify(data?.post));
	const path = `/src/content/posts/${data.post.slug}.md`;
	const loader = modules[path];
	if (!loader) error(404, 'Post not found');
	const mod = await loader();
	// Server data is NOT auto-merged into the page here — pass it through.
	return { ...data, component: mod.default };
};

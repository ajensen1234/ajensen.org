import { error } from '@sveltejs/kit';
import { posts } from '$lib/server/posts';
import type { EntryGenerator, PageServerLoad } from './$types';

// Prerender entry list derived from the single-source posts module — no
// crawling dependence, and a slug that exists here is guaranteed to have an
// exported markdown (the staleness gate rejects anything else at build start).
export const entries: EntryGenerator = () => posts.map((post) => ({ slug: post.slug }));

export const load: PageServerLoad = ({ params }) => {
	const post = posts.find((p) => p.slug === params.slug);
	if (!post) error(404, 'Post not found');
	return { post };
};

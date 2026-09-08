import { posts } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

// Server-only load: post metadata comes from the single-source posts module,
// stripped from the client bundle after prerender.
export const load: PageServerLoad = () => ({ posts });

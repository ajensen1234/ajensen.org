import { projects } from '$lib/server/projects';
import type { PageServerLoad } from './$types';

// Server-only load: project data files are parsed at build time (R4),
// stripped from the client bundle after prerender.
export const load: PageServerLoad = () => ({ projects });

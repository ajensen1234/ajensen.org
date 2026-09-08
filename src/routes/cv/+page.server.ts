import { cv } from '$lib/server/cv';
import type { PageServerLoad } from './$types';

// Server-only load: CV data is parsed at build time (R1), stripped from the
// client bundle after prerender.
export const load: PageServerLoad = () => ({ cv });

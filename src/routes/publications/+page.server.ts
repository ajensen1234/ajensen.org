import { invitedTalks, presentations, publications } from '$lib/server/bibtex';
import type { PageServerLoad } from './$types';

// Server-only load: parses the vendored cv.bib at build time (R2), stripped
// from the client bundle after prerender. A universal +page.ts load could not
// import $lib/server modules.
export const load: PageServerLoad = () => ({
	publications,
	invitedTalks,
	presentations
});

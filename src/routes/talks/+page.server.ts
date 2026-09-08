import { talks } from '$lib/server/bibtex';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ talks });

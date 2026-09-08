// Single source of truth for site identity and URLs (R15/R16).
// Every OG tag, feed URL, and sitemap entry derives from these constants.
export const SITE_URL = 'https://www.ajensen.org';
export const SITE_TITLE = 'Andrew Jensen';
export const SITE_DESCRIPTION =
	'Andrew Jensen — mechanical engineer turned ML/CV researcher. Autonomous joint kinematics, CBCT reconstruction, and deep-tech R&D.';
export const OWNER_NAME = 'Andrew Jensen';
/** Author-bolding match for publication lists (case-insensitive prefix match). */
export const OWNER_AUTHOR = { firstName: 'andrew', lastName: 'jensen' } as const;

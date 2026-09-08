// Full prerendering (R17) with directory-style URLs for GitHub Pages.
// trailingSlash is decided ONCE here ('always') and must never change after
// URLs are indexed — see the footgun checklist in the requirements doc.
export const prerender = true;
export const trailingSlash = 'always';

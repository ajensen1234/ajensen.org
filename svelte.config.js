import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx', '.md'] })],
	// mdsvex consumes .md/.svx as content-only markdown (no runes in markdown — mdsvex #738)
	extensions: ['.svelte', '.svx', '.md'],
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			// GitHub Pages serves this for unknown URLs (R13).
			// NOTE: setting a fallback switches adapter-static into SPA-tolerant mode,
			// muting its strict all-routes-prerendered error — loud failure (R17) comes
			// from the prerenderer's handleError/handleHttpError defaults below.
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		prerender: {
			// Crawl every reachable route; fail loudly on dead links (default 'fail').
			entries: ['*']
		}
		// Custom domain at the ROOT (www.ajensen.org) — paths.base stays EMPTY.
		// Never copy a tutorial's `base: '/repo-name'`; it breaks every asset URL here.
	}
};

export default config;

// See https://svelte.dev/docs/kit/types#app.d.ts for details.
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

// mdsvex compiles .md/.svx into Svelte components with a `metadata` named export.
declare module '*.md' {
	import type { Component } from 'svelte';
	export const metadata: Record<string, unknown>;
	const Component: Component;
	export default Component;
}

declare module '*.svx' {
	import type { Component } from 'svelte';
	export const metadata: Record<string, unknown>;
	const Component: Component;
	export default Component;
}

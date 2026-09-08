<script lang="ts">
	import '../app.css';
	import { SITE_TITLE } from '$lib/site';

	let { children } = $props();
</script>

<!-- Bare-bones layout; Nav/Footer/theme-toggle arrive in U7 (design pass). -->
<svelte:head>
	<title>{SITE_TITLE}</title>
</svelte:head>

<main class="mx-auto max-w-3xl px-6 py-16">
	{@render children()}
</main>

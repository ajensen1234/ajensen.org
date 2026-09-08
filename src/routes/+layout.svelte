<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	import { SITE_TITLE } from '$lib/site';
	import Footer from '$lib/components/Footer.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { children } = $props();
</script>

<!-- Structural layout (U7 stub): nav + theme toggle + footer wired in; visual
	polish (custom themes, typography, homepage composition) deferred. -->
<div class="mx-auto flex min-h-screen max-w-3xl flex-col px-6">
	<header class="flex flex-wrap items-center justify-between gap-3 py-6">
		<a href={resolve('/')} class="font-medium no-underline">{SITE_TITLE}</a>
		<div class="flex items-center gap-4">
			<Nav />
			<ThemeToggle />
		</div>
	</header>

	<main class="flex-1 py-8">
		{@render children()}
	</main>

	<div class="py-6">
		<Footer />
	</div>
</div>

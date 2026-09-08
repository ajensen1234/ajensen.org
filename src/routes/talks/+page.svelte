<script lang="ts">
	import PublicationEntry from '$lib/components/PublicationEntry.svelte';
	import type { Entry } from '$lib/server/bibtex';
	import { SITE_TITLE } from '$lib/site';

	let { data }: { data: { talks: Entry[] } } = $props();
</script>

<svelte:head>
	<title>Talks · {SITE_TITLE}</title>
</svelte:head>

<section class="prose max-w-none">
	<h1>Talks &amp; presentations</h1>
	{#if data.talks.length === 0}
		<p class="text-base-content/70">Nothing here yet — talks will appear once added to the bibliography.</p>
	{:else}
		<div>
			{#each data.talks as entry (entry.key)}
				<PublicationEntry {entry} showLocation />
			{/each}
		</div>
	{/if}
</section>

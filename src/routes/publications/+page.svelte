<script lang="ts">
	import PublicationEntry from '$lib/components/PublicationEntry.svelte';
	import type { Entry } from '$lib/server/bibtex';
	import { SITE_TITLE } from '$lib/site';

	let { data }: { data: { publications: Entry[]; invitedTalks: Entry[]; presentations: Entry[] } } =
		$props();

	let sections = $derived.by((): { title: string; entries: Entry[] }[] => [
		{ title: 'Publications', entries: data.publications },
		{ title: 'Invited Talks', entries: data.invitedTalks },
		{ title: 'Presentations', entries: data.presentations }
	]);
</script>

<svelte:head>
	<title>Publications · {SITE_TITLE}</title>
</svelte:head>

<section class="prose max-w-none">
	<h1>Publications, invited talks &amp; presentations</h1>

	{#each sections as section (section.title)}
		<h2>{section.title}</h2>
		{#if section.entries.length === 0}
			<p class="text-base-content/70">
				Nothing here yet — entries tagged <code>{section.title.toLowerCase()}</code> will appear
				once added to the bibliography.
			</p>
		{:else}
			<div>
				{#each section.entries as entry (entry.key)}
					<PublicationEntry {entry} />
				{/each}
			</div>
		{/if}
	{/each}
</section>

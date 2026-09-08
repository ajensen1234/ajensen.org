<script lang="ts">
	import type { Author, Entry } from '$lib/server/bibtex';
	import { OWNER_AUTHOR } from '$lib/site';

	let { entry, showLocation = false }: { entry: Entry; showLocation?: boolean } = $props();

	// Case-insensitive first-name-prefix + last-name match (handles middle
	// initials: "Andrew A. Jensen" and "Andrew Jensen" both bold).
	const isOwner = (author: Author): boolean =>
		author.lastName?.toLowerCase() === OWNER_AUTHOR.lastName &&
		(author.firstName?.toLowerCase().startsWith(OWNER_AUTHOR.firstName) ?? false);

	const titleLink = $derived(entry.url ?? (entry.doi ? `https://doi.org/${entry.doi}` : null));
</script>

<article class="border-base-200 border-b py-3 last:border-b-0">
	<p class="text-sm">
		{#each entry.authors as author, index (author.fullName)}{#if index > 0}, {/if}<span
				class:font-semibold={isOwner(author)}>{author.fullName}</span
			>{/each}
	</p>
	<p class="font-medium">
		{#if titleLink}
			<a class="link link-primary" href={titleLink}>{entry.title}</a>
		{:else}
			{entry.title}
		{/if}
	</p>
	<p class="text-base-content/70 text-sm">
		{#if entry.venue}{entry.venue} · {/if}{entry.year}{#if showLocation && entry.location}
			· {entry.location}{/if}
	</p>
	{#if entry.note}
		<p class="text-sm"><span class="text-base-content/70">{entry.note}</span></p>
	{/if}
</article>

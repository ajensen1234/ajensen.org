<script lang="ts">
	import { buildOg } from '$lib/og';

	let {
		title,
		description,
		path,
		image,
		type
	}: {
		title: string;
		description?: string;
		path?: string;
		image?: string;
		type?: 'website' | 'article';
	} = $props();

	const tags = $derived(buildOg({ title, description, path, image, type }));
</script>

<svelte:head>
	{#each Object.entries(tags) as [property, content] (property)}
		<meta property={property} content={content} />
	{/each}
</svelte:head>

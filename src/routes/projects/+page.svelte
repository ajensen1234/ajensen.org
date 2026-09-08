<script lang="ts">
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import { SITE_TITLE } from '$lib/site';
	import type { Project } from '$lib/server/projects';

	let { data }: { data: { projects: Project[] } } = $props();
</script>

<svelte:head>
	<title>Projects · {SITE_TITLE}</title>
</svelte:head>

<section class="prose max-w-none">
	<h1>Projects</h1>
	{#if data.projects.length === 0}
		<p class="text-base-content/70">Nothing here yet — projects will appear once added.</p>
	{:else}
		<div>
			{#each data.projects as project (project.slug)}
				<ProjectCard {project} />
			{/each}
		</div>
	{/if}
</section>

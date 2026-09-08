<script lang="ts">
	import type { Project } from '$lib/server/projects';

	let { project }: { project: Project } = $props();
</script>

<article class="border-base-200 border-b py-4 last:border-b-0">
	<div class="flex flex-wrap items-baseline justify-between gap-x-4">
		<h3 class="font-medium">{project.title}</h3>
		<p class="text-base-content/70 text-sm">
			{project.period}
			{#if project.highlight}<span class="badge badge-primary badge-sm ml-1">highlight</span>{/if}
		</p>
	</div>
	<p class="text-sm">{project.role}</p>
	<p class="text-base-content/70 mt-1 text-sm">{project.summary}</p>
	{#if project.links.length > 0}
		<!-- svelte-autofixer (known false positive, documented): data-driven
			external URLs have no compliant form under the href rule (resolve()
			throws on absolute URLs); see PublicationEntry.svelte. -->
		<p class="mt-2 flex gap-3 text-sm">
			{#each project.links as link (link.url)}
				<a class="link link-primary" href={link.url}>{link.label}</a>
			{/each}
		</p>
	{/if}
</article>

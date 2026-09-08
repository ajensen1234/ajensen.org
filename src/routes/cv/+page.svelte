<script lang="ts">
	import type { CvData } from '$lib/server/cv';
	import { SITE_TITLE } from '$lib/site';

	let { data }: { data: { cv: CvData } } = $props();

	let sections = $derived.by((): { title: string; items: CvData['education'] }[] => [
		{ title: 'Education', items: data.cv.education },
		{ title: 'Positions', items: data.cv.positions }
	]);
</script>

<svelte:head>
	<title>CV · {SITE_TITLE}</title>
</svelte:head>

<section class="prose max-w-none">
	<div class="flex flex-wrap items-baseline justify-between gap-x-4">
		<h1>Curriculum Vitae</h1>
		<!-- svelte-autofixer (known false positive, documented): internal static
			href — the rule wants resolve(); fine to document (lint noise only). -->
		<a class="link link-primary" href="/resume.pdf">Download resume.pdf</a>
	</div>

	{#each sections as section (section.title)}
		<h2>{section.title}</h2>
		<div>
			{#each section.items as item, index (index)}
				<article class="border-base-200 border-b py-3 last:border-b-0">
					<div class="flex flex-wrap items-baseline justify-between gap-x-4">
						<h3 class="font-medium">
							{item.school ?? item.org}
							{#if item.location}<span class="text-base-content/70 text-sm font-normal"
									>· {item.location}</span
								>{/if}
						</h3>
						<p class="text-base-content/70 text-sm">{item.period}</p>
					</div>
					{#if item.title ?? item.degree}<p class="text-sm">{item.title ?? item.degree}</p>{/if}
					{#if item.details.length > 0}
						<ul class="text-base-content/70 text-sm">
							{#each item.details as detail (detail)}
								<li>{detail}</li>
							{/each}
						</ul>
					{/if}
				</article>
			{/each}
		</div>
	{/each}
</section>

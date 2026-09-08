<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SITE_TITLE } from '$lib/site';
</script>

<svelte:head>
	<title>{page.status} · {SITE_TITLE}</title>
</svelte:head>

<section class="prose max-w-none">
	<h1>{page.status}</h1>
	<p>
		{page.error?.message === 'Not Found'
			? "That page doesn't exist."
			: (page.error?.message ?? 'Something went wrong.')}
	</p>
	<p><a class="link link-primary" href={resolve('/')}>← Back to the homepage</a></p>
</section>

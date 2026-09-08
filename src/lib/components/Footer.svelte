<script lang="ts">
	import { resolve } from '$app/paths';
	import { OWNER_NAME, SITE_URL } from '$lib/site';

	const year = new Date().getFullYear();
</script>

<footer class="text-base-content/70 flex flex-wrap items-center justify-between gap-2 text-sm">
	<p>© {year} {OWNER_NAME}</p>
	<p class="flex gap-3">
		<!-- svelte-autofixer (known false positive, documented): endpoint/static
			hrefs — resolve() only knows page routes; see PublicationEntry.svelte. -->
		<a class="link link-hover" href="/rss.xml">RSS</a>
		<a class="link link-hover" href="{SITE_URL}/resume.pdf">CV (PDF)</a>
	</p>
</footer>

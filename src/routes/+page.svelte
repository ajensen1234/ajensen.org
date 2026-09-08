<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { SITE_TITLE } from '$lib/site';
</script>

<svelte:head>
	<title>{SITE_TITLE}</title>
</svelte:head>

<Seo title="Andrew Jensen — ML/CV researcher in orthopaedic biomechanics" />

<!--
	Minimal landing page (R18 hierarchy seed). Bespoke design and the full
	R18 composition (latest publications, CV link, highlighted projects) land in U7.
-->
<section class="prose prose-lg max-w-none">
	<h1>Andrew Jensen</h1>
	<p>
		Mechanical engineer turned ML/CV researcher. I build autonomous systems for measuring
		joint kinematics and lead deep-tech R&amp;D at a medical imaging startup.
	</p>
	<p><span class="loading loading-dots loading-sm"></span> Site rebuild in progress — publications, talks, and posts coming soon.</p>
</section>

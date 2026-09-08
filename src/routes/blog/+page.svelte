<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import { SITE_TITLE } from '$lib/site';
	import type { PostMeta } from '$lib/server/posts';

	let { data }: { data: { posts: PostMeta[] } } = $props();
</script>

<Seo title={`Blog · ${SITE_TITLE}`} path="/blog/" />

<section class="prose max-w-none">
	<h1>Blog</h1>
	{#if data.posts.length === 0}
		<p class="text-base-content/70">Nothing here yet — first post coming soon.</p>
	{:else}
		<ul class="not-prose divide-base-200 divide-y">
			{#each data.posts as post (post.slug)}
				<li class="py-3">
					<a class="link link-hover font-medium" href={resolve(`/blog/${post.slug}/`)}>
						{post.title}
					</a>
					<p class="text-base-content/70 text-sm">
						<time datetime={post.date}>{post.date}</time>
						{#if post.description}· {post.description}{/if}
					</p>
				</li>
			{/each}
		</ul>
	{/if}
</section>

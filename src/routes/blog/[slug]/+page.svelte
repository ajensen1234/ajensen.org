<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';

	let { data }: { data: { post: import('$lib/server/posts').PostMeta; component: unknown } } =
		$props();

	// mdsvex compiled the post into a content-only component (no runes — issue
	// #738); the universal load hands us its default export. Rune-mode dynamic
	// rendering: an uppercase $derived binding used as an element.
	const Post = $derived(data.component as import('svelte').Component);
</script>

<Seo
	title={data.post.title}
	description={data.post.description}
	path={`/blog/${data.post.slug}/`}
	type="article"
/>

<article class="prose max-w-none">
	<h1>{data.post.title}</h1>
	<p class="text-base-content/70 text-sm">
		<time datetime={data.post.date}>{data.post.date}</time>
		{#if data.post.tags.length > 0}
			· {data.post.tags.join(', ')}
		{/if}
	</p>
	<Post />
</article>

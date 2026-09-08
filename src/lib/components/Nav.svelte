<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	// R18 nav order — fixed, single level, inline links (no menu machinery).
	const links = [
		['/', 'Home'],
		['/publications', 'Publications'],
		['/projects', 'Projects'],
		['/talks', 'Talks'],
		['/blog', 'Blog'],
		['/cv', 'CV']
	] as const;
</script>

<nav aria-label="Main navigation">
	<ul class="flex flex-wrap gap-x-5 gap-y-1 text-sm">
		{#each links as [path, label] (path)}
			<li>
				<a
					href={resolve(path)}
					class="link link-hover"
					aria-current={page.url.pathname === resolve(path) ? 'page' : undefined}
				>
					{label}
				</a>
			</li>
		{/each}
	</ul>
</nav>

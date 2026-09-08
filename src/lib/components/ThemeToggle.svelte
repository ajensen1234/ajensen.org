<script lang="ts">
	import { browser } from '$app/environment';

	// Pre-paint script in app.html already applied the theme; read it on mount.
	// With JS disabled this button is absent and the default theme renders (R9).
	let theme = $state<'light' | 'dark'>(
		browser && document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
	);

	function toggle() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', theme);
		try {
			localStorage.setItem('theme', theme);
		} catch {
			// localStorage unavailable — theme still applies for this page view.
		}
	}
</script>

<button
	type="button"
	class="btn btn-ghost btn-sm"
	aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
	onclick={toggle}
>
	{theme === 'dark' ? '☀︎' : '☾'}
</button>

<script>
	import './layout.css';
	import { onMount } from 'svelte';
	import { Sun, Moon } from 'lucide-svelte';

	let dark = false;

	onMount(() => {
		dark = localStorage.theme === 'dark';
		document.documentElement.classList.toggle('dark', dark);
	});

	function toggleTheme() {
		dark = !dark;
		document.documentElement.classList.toggle('dark', dark);
		localStorage.theme = dark ? 'dark' : 'light';
	}
</script>

<button
	on:click={toggleTheme}
	aria-label="Toggle theme"
	class="fixed bottom-18 left-4 flex h-10 w-10 items-center justify-center
	       rounded-full border border-gray-300 bg-white/80 shadow-sm
	       backdrop-blur transition-all duration-300
	       hover:scale-105 hover:shadow-md
	       dark:border-gray-700 dark:bg-gray-900/80"
>
	{#if dark}
		<Sun
			class="h-5 w-5 text-yellow-400 transition-all duration-300
			       rotate-0 scale-100 opacity-100"
		/>
	{:else}
		<Moon
			class="h-5 w-5 text-slate-700 transition-all duration-300
			       rotate-0 scale-100 opacity-100 dark:text-slate-300"
		/>
	{/if}
</button>

<slot />

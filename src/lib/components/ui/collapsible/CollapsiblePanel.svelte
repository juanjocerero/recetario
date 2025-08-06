<script lang="ts">
	import { slide } from 'svelte/transition';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import type { Snippet } from 'svelte';

	let { title, startOpen = true, children }: { title: string; startOpen?: boolean; children: Snippet } = $props();
	let isOpen = $state(startOpen);

	$effect(() => {
		isOpen = startOpen;
	});

	function toggle() {
		isOpen = !isOpen;
	}
</script>

<div class="rounded-lg border">
	<h2>
		<button
			onclick={toggle}
			class="flex w-full items-center justify-between p-4 text-lg font-semibold"
			aria-expanded={isOpen}
		>
			{title}
			<ChevronDown
				class={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
			/>
		</button>
	</h2>
	{#if isOpen}
		<div transition:slide={{ duration: 200 }} class="p-4 pt-0">
			{@render children()}
		</div>
	{/if}
</div>
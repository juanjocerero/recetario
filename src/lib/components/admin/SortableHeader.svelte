<script lang="ts">
	import { ArrowDown, ArrowUp } from 'lucide-svelte';
	import * as Table from '$lib/components/ui/table';
	import { cn } from '$lib/utils';
	import { page } from '$app/state';

	let {
		class: className = '',
		column,
		label
	} = $props<{ class?: string; column: string; label: string }>();

	const currentSort = $derived(page.url.searchParams.get('sort'));
	const currentOrder = $derived(page.url.searchParams.get('order'));
	const currentSearch = $derived(page.url.searchParams.get('search'));

	const isActive = $derived(currentSort === column);
	const nextOrder = $derived(isActive && currentOrder === 'asc' ? 'desc' : 'asc');

	let href = $state('');
	$effect(() => {
		const params = new URLSearchParams();
		if (currentSearch) {
			params.set('search', currentSearch);
		}
		params.set('sort', column);
		params.set('order', nextOrder);
		href = `?${params.toString()}`;
	});
</script>

<Table.Head class={cn('p-0', className)}>
	<a {href} class="flex w-full items-center gap-2 p-4 no-underline hover:bg-muted/50">
		<span>{label}</span>
		{#if isActive}
			{#if currentOrder === 'asc'}
				<ArrowUp class="h-4 w-4" />
			{:else}
				<ArrowDown class="h-4 w-4" />
			{/if}
		{/if}
	</a>
</Table.Head>
<!-- Ruta: src/lib/components/diary/AddItemPanel.svelte -->
<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { buttonVariants } from '$lib/components/ui/button';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { Input } from '$lib/components/ui/input';
	import type { Product } from '@prisma/client';
	import type { FullRecipe } from '$lib/models/recipe';
	import { cn } from '$lib/utils';

	type SearchResult = (Product & { type: 'PRODUCT' }) | (FullRecipe & { type: 'RECIPE' });

	let { onAddItem }: { onAddItem: (item: SearchResult) => void } = $props();

	let isOpen = $state(false);
	let searchTerm = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let isLoading = $state(false);
	let controller: AbortController;

	$effect(() => {
		controller?.abort();
		const query = searchTerm;
		if (query.length < 2) {
			searchResults = [];
			isLoading = false;
			return;
		}
		controller = new AbortController();

		async function search() {
			isLoading = true;
			try {
				const response = await fetch(`/api/search/all?q=${encodeURIComponent(query)}`, {
					signal: controller.signal
				});
				if (response.ok) {
					searchResults = await response.json();
				}
			} catch (e) {
				if (e instanceof DOMException && e.name === 'AbortError') return;
				console.error('Failed to search items', e);
				searchResults = [];
			} finally {
				isLoading = false;
			}
		}
		search();
	});

	function handleSelect(item: SearchResult) {
		onAddItem(item);
		searchTerm = '';
		searchResults = [];
		isOpen = false;
	}
</script>

<Collapsible.Root bind:open={isOpen} class="w-full space-y-2">
	<div class="flex items-center justify-between space-x-4 px-1">
		<h4 class="text-lg font-semibold">Añadir Elemento</h4>
		<Collapsible.Trigger
			class={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-9 p-0')}
		>
			<ChevronsUpDown class="h-4 w-4" />
			<span class="sr-only">Toggle</span>
		</Collapsible.Trigger>
	</div>

	<div class="p-1">
		<Input bind:value={searchTerm} placeholder="Buscar producto o receta..." />
	</div>

	<Collapsible.Content class="space-y-2">
		{#if isLoading}
			<p class="text-sm text-center text-muted-foreground py-2">Buscando...</p>
		{:else if searchResults.length > 0}
			<div class="max-h-60 overflow-y-auto rounded-md border">
				{#each searchResults as item (item.id)}
					<button
						onclick={() => handleSelect(item)}
						class="flex w-full items-center gap-3 p-2 text-left hover:bg-accent"
					>
						<span class="text-xs font-bold text-muted-foreground w-16">
							{item.type === 'PRODUCT' ? 'PROD' : 'RECETA'}
						</span>
						<span>{item.type === 'PRODUCT' ? item.name : item.title}</span>
					</button>
				{/each}
			</div>
		{/if}
	</Collapsible.Content>
</Collapsible.Root>

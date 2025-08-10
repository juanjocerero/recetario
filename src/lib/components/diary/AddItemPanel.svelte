<!-- Ruta: src/lib/components/diary/AddItemPanel.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import type { Product } from '@prisma/client';
	import type { FullRecipe } from '$lib/models/recipe';
	import DatePicker from '$lib/components/shared/DatePicker.svelte';
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';

	type SearchResult = (Product & { type: 'PRODUCT' }) | (FullRecipe & { type: 'RECIPE' });

	let {
		onAddItem
	}: { onAddItem: (data: { item: SearchResult; date: Date }) => void } = $props();

	let addDate: DateValue = $state(today(getLocalTimeZone()));
	let open = $state(false);
	let searchTerm = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let isLoading = $state(false);
	let controller: AbortController;
	let triggerWrapperEl: HTMLDivElement | null = $state(null);

	// Efecto para ajustar el ancho del popover al del trigger
	$effect(() => {
		if (browser && open && triggerWrapperEl) {
			const contentEl = document.querySelector<HTMLDivElement>('[data-add-item-popover-content]');
			if (contentEl) {
				const rect = triggerWrapperEl.getBoundingClientRect();
				contentEl.style.width = `${rect.width}px`;
			}
		}
	});

	// Efecto para realizar la búsqueda cuando el término cambia
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
		onAddItem({ item, date: addDate.toDate(getLocalTimeZone()) });
		searchTerm = '';
		open = false;
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex-1">
		<p class="text-sm font-medium mb-2">Fecha</p>
		<DatePicker bind:value={addDate} />
	</div>
	<div class="flex-1" bind:this={triggerWrapperEl}>
		<p class="text-sm font-medium mb-2">Producto o Receta</p>
		<Popover.Root bind:open>
			<Popover.Trigger
				class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				role="combobox"
			>
				Añadir producto o receta...
				<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</Popover.Trigger>
			<Popover.Content data-add-item-popover-content class="p-0">
				<Command.Root filter={() => 1}>
					<Command.Input bind:value={searchTerm} placeholder="Buscar..." />
					<Command.List>
						<Command.Empty>
							{#if isLoading}
								Buscando...
							{:else if searchTerm.length < 2}
								Escribe al menos 2 caracteres.
							{:else}
								No se encontraron resultados.
							{/if}
						</Command.Empty>
						{#each searchResults as item (`${item.type}-${item.id}`)}
							<Command.Item
								onSelect={() => handleSelect(item)}
								value={item.type === 'PRODUCT' ? item.name : item.title}
							>
								<div class="flex items-center gap-3 w-full">
									<span class="text-xs font-bold text-muted-foreground w-16">
										{item.type === 'PRODUCT' ? 'PROD' : 'RECETA'}
									</span>
									<span class="truncate">
										{item.type === 'PRODUCT' ? item.name : item.title}
									</span>
								</div>
							</Command.Item>
						{/each}
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>
</div>

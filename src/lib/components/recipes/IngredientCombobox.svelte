<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import { browser } from '$app/environment';

	type Ingredient = {
		id: string;
		name: string;
		type: 'product' | 'custom';
		source: 'local' | 'off';
		imageUrl: string | null;
	};

	let { onSelect, selectedIds = [], onClear }: {
		onSelect: (ingredient: Ingredient) => void;
		selectedIds: string[];
		onClear: () => void;
	} = $props();

	let open = $state(false);
	let searchValue = $state('');
	let searchResults = $state<Ingredient[]>([]);
	let isLoading = $state(false);
	let controller: AbortController;
	let triggerWrapperEl: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (browser && open && triggerWrapperEl) {
			const contentEl = document.querySelector<HTMLDivElement>('[data-slot="popover-content"]');
			if (contentEl) {
				const rect = triggerWrapperEl.getBoundingClientRect();
				contentEl.style.width = `${rect.width}px`;
			}
		}
	});

	$effect(() => {
		controller?.abort();
		const query = searchValue;
		if (query.length < 2 || !open) {
			searchResults = [];
			isLoading = false;
			return;
		}
		controller = new AbortController();

		async function search() {
			isLoading = true;
			try {
				const response = await fetch(`/api/products/autocomplete?q=${encodeURIComponent(query)}`, {
					signal: controller.signal
				});
				const allResults: Ingredient[] = await response.json();
				searchResults.length = 0;
				searchResults.push(...allResults.filter((r) => !selectedIds.includes(r.id)));
			} catch (e) {
				if (e instanceof DOMException && e.name === 'AbortError') {
					return;
				}
				console.error('Failed to search ingredients', e);
				searchResults = [];
			} finally {
				isLoading = false;
			}
		}
		search();
	});

	function handleSelect(ingredient: Ingredient) {
		onSelect(ingredient);
		searchValue = '';
		open = false;
	}
</script>

<div class="flex items-center gap-2">
	<div class="flex-grow" bind:this={triggerWrapperEl}>
		<Popover.Root bind:open>
			<Popover.Trigger
				role="combobox"
				class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-accent hover:text-accent-foreground"
			>
				Seleccionar ingrediente...
				<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</Popover.Trigger>
			<Popover.Content data-slot="popover-content" class="p-0">
				{#key searchValue}
					<Command.Root>
						<Command.Input bind:value={searchValue} placeholder="Buscar ingrediente..." />
						<Command.Empty>
							{#if isLoading}
								Buscando...
							{:else if searchValue.length < 2}
								Escribe al menos 2 letras.
							{:else}
								No se encontraron productos.
							{/if}
						</Command.Empty>
						<Command.Group>
							{#each searchResults as ingredient (ingredient.id)}
								<Command.Item onSelect={() => handleSelect(ingredient)}>
									{ingredient.name}
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.Root>
				{/key}
			</Popover.Content>
		</Popover.Root>
	</div>
	{#if selectedIds.length > 0}
		<Button onclick={onClear} variant="ghost" size="icon" aria-label="Limpiar productos seleccionados">
			<Trash2 class="h-4 w-4" />
		</Button>
	{/if}
</div>

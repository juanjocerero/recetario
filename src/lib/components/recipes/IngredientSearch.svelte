<!-- src/lib/components/recipes/IngredientSearch.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { ChevronsUpDown, Database } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { cn } from '$lib/utils';
	import type { CalculableProduct } from '$lib/recipeCalculator';

	// --- Tipos ---
	type IngredientWithDetails = CalculableProduct & {
		id: string;
		name: string;
		source: 'local' | 'off';
		imageUrl?: string | null;
	};

	type SearchResult = {
		id: string;
		name: string;
		source: 'local' | 'off';
		imageUrl: string | null;
	};

	// --- Props ---
	let { onAdd }: { onAdd: (ingredient: IngredientWithDetails) => void } = $props();

	// --- Estado Interno ---
	let searchResults: SearchResult[] = $state([]);
	let isSearching = $state(false);
	let open = $state(false);
	let inputValue = $state('');
	let searchTerm = $state('');
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
		let eventSource: EventSource | null = null;

		if (searchTerm.length < 3) {
			searchResults = [];
			isSearching = false;
		} else {
			const currentSearchTerm = searchTerm;
			isSearching = true;
			searchResults = [];
			eventSource = new EventSource(`/api/products/search?q=${encodeURIComponent(currentSearchTerm)}`);

			eventSource.addEventListener('message', (e) => {
				if (currentSearchTerm === searchTerm) {
					const newResults = JSON.parse(e.data) as SearchResult[];

					const combinedResults = [...searchResults, ...newResults];
					const uniqueNames = new Set<string>();

					const uniqueResults = combinedResults.filter((result) => {
						// Usamos el nombre como clave de de-duplicación, ya que el ID no es fiable
						const key = result.name + result.source;
						if (uniqueNames.has(key)) {
							return false;
						}
						uniqueNames.add(key);
						return true;
					});

					searchResults = uniqueResults;
				}
			});

			eventSource.addEventListener('local_results', (e) => {
				if (currentSearchTerm === searchTerm) {
					const newResults = JSON.parse(e.data) as SearchResult[];

					const combinedResults = [...searchResults, ...newResults];
					const uniqueNames = new Set<string>();

					const uniqueResults = combinedResults.filter((result) => {
						// Usamos el nombre como clave de de-duplicación, ya que el ID no es fiable
						const key = result.name + result.source;
						if (uniqueNames.has(key)) {
							return false;
						}
						uniqueNames.add(key);
						return true;
					});

					searchResults = uniqueResults;
				}
			});

			eventSource.addEventListener('stream_error', (e) => {
				if (currentSearchTerm === searchTerm) {
					console.error('Error de stream:', e);
				}
			});

			eventSource.onerror = (err) => {
				console.error('Error en EventSource:', err);
				if (currentSearchTerm === searchTerm) {
					isSearching = false;
				}
				eventSource?.close();
			};

			eventSource.addEventListener('close', () => {
				if (currentSearchTerm === searchTerm) {
					isSearching = false;
				}
				eventSource?.close();
			});
		}

		return () => {
			eventSource?.close();
		};
	});

	async function handleSelect(result: SearchResult) {
		try {
			const response = await fetch(`/api/products/details/${result.id}?source=${result.source}`);
			if (!response.ok) throw new Error('Failed to fetch ingredient details');
			const details: Omit<IngredientWithDetails, 'id' | 'source'> = await response.json();

			// Llama al callback del padre en lugar de despachar un evento
			onAdd({
				...details,
				id: result.id,
				source: result.source
			});
		} catch (error) {
			console.error('Error adding ingredient:', error);
			toast.error('No se pudieron obtener los detalles del ingrediente.');
		} finally {
			open = false;
			searchResults = [];
			searchTerm = '';
			inputValue = '';
		}
	}
</script>

<div bind:this={triggerWrapperEl}>
	<Popover.Root bind:open>
		<Popover.Trigger
			class="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border w-full justify-between h-9 px-4 py-2"
			role="combobox"
			aria-expanded={open}
		>
			<div class="flex items-center justify-between w-full">
				{inputValue || 'Seleccionar ingrediente...'}
				<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</div>
		</Popover.Trigger>
		<Popover.Content class="p-0">
			<Command.Root filter={() => 1}>
				<Command.Input bind:value={searchTerm} placeholder="Buscar ingrediente..." />
				<Command.List>
					{#if searchResults.length > 0}
						{#each searchResults as result (result.id + result.source)}
							<Command.Item
								value={result.name}
								onSelect={() => {
									inputValue = result.name;
									handleSelect(result);
								}}
								class={cn(
									'flex items-center justify-between w-full',
									result.source === 'local' ? 'bg-muted/50' : ''
								)}
							>
								<div class="flex items-center gap-2">
									<img
										src={result.imageUrl || 'https://placehold.co/40x40?text=N/A'}
										alt={result.name}
										class="h-8 w-8 rounded-sm object-cover"
									/>
									<span>{result.name}</span>
								</div>
								{#if result.source === 'local'}
									<Database class="h-4 w-4 text-muted-foreground" />
								{/if}
							</Command.Item>
						{/each}
					{:else}
						<div class="p-4 text-sm text-center text-gray-500">
							{#if isSearching}
								Buscando...
							{:else if searchTerm.length < 3}
								Escribe al menos 3 caracteres para buscar...
							{:else}
								No se encontraron resultados.
							{/if}
						</div>
					{/if}
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
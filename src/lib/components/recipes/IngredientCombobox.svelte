<!--
// Fichero: src/lib/components/recipes/IngredientCombobox.svelte
// --- VERSIÓN CON ABORTCONTROLLER ---
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';

	type Ingredient = {
		id: string;
		name: string;
		type: 'product' | 'custom';
		source: 'local' | 'off';
		imageUrl: string | null;
	};

	let { onSelect, selectedIds = [] }: {
		onSelect: (ingredient: Ingredient) => void;
		selectedIds: string[];
	} = $props();

	let open = $state(false);
	let searchValue = $state('');
	let searchResults = $state<Ingredient[]>([]);
	let isLoading = $state(false);
	let controller: AbortController;

	// Justificación (AbortController): Este efecto se ejecuta cada vez que `searchValue` cambia.
	// En lugar de un `debounce`, usa un `AbortController` para cancelar la petición
	// anterior antes de lanzar una nueva. Esto previene condiciones de carrera y es
	// más eficiente y robusto.
	$effect(() => {
		// 1. Cancela la petición anterior si existe.
		controller?.abort();

		const query = searchValue;
		if (query.length < 2 || !open) {
			searchResults = [];
			isLoading = false;
			return;
		}

		// 2. Crea un nuevo controlador para la nueva petición.
		controller = new AbortController();

		async function search() {
			isLoading = true;
			try {
				const response = await fetch(`/api/ingredients/autocomplete?q=${encodeURIComponent(query)}`, {
					signal: controller.signal
				});
				const allResults: Ingredient[] = await response.json();

				// --- INICIO DE CÓDIGO DE DEPURACIÓN ---
				console.log('[DEBUG] Resultados de la API:', allResults);
				console.log('[DEBUG] IDs ya seleccionados:', selectedIds);
				// --- FIN DE CÓDIGO DE DEPURACIÓN ---

				// Justificación: Se muta el array en lugar de reasignarlo. Esto asegura
				// que Svelte 5 detecte el cambio de forma robusta.
				searchResults.length = 0; // Limpia el array
				searchResults.push(...allResults.filter((r) => !selectedIds.includes(r.id)));
			} catch (e) {
				// 4. Si el error es por abortar, lo ignoramos silenciosamente.
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

<Popover.Root bind:open>
	<Popover.Trigger
		role="combobox"
		class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-accent hover:text-accent-foreground"
	>
		Seleccionar ingrediente...
		<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
	</Popover.Trigger>
	<Popover.Content class="w-[--radix-popover-trigger-width] p-0">
		{#key searchValue}
			<Command.Root>
				<Command.Input bind:value={searchValue} placeholder="Buscar ingrediente..." />
				<Command.Empty>
					{#if isLoading}
						Buscando...
					{:else if searchValue.length < 2}
						Escribe al menos 2 letras.
					{:else}
						No se encontraron ingredientes.
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
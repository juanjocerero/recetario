<!--
// Fichero: src/routes/recetas/busqueda-avanzada/+page.svelte
// --- VERSIÓN FINAL CON CORRECCIÓN DE BUCLE REACTIVO Y HTML COMPLETO ---
-->
<script lang="ts">
	import IngredientCombobox from '$lib/components/recipes/IngredientCombobox.svelte';
	import MacroFilters from '$lib/components/recipes/MacroFilters.svelte';
	import type { MacroFilterValues } from '$lib/components/recipes/MacroFilters.svelte';
	import RecipeCard from '$lib/components/recipes/RecipeCard.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import X from 'lucide-svelte/icons/x';
	import { useDebounce } from '$lib/runes/useDebounce.svelte';

	type Ingredient = { id: string; name: string; type: 'product' | 'custom' };
	type Recipe = any;

	// --- ESTADO DESACOPLADO ---
	let selectedIngredients = $state<Ingredient[]>([]);
	let macroFilters = $state<MacroFilterValues>({
		unit: 'grams',
		calories: {},
		protein: {},
		carbs: {},
		fat: {}
	});
	let sortBy = $state('title_asc');

	// --- ESTADO DE RESULTADOS ---
	let recipes = $state<Recipe[]>([]);
	let isLoading = $state(false);
	let hasMore = $state(true);
	let sentinel: HTMLDivElement | undefined = $state();
	let controller: AbortController;

	// --- ESTADO DERIVADO ---
	const searchFilters = $derived({
		ingredients: selectedIngredients.map((i) => i.id),
		unit: macroFilters.unit,
		calories: macroFilters.calories,
		protein: macroFilters.protein,
		carbs: macroFilters.carbs,
		fat: macroFilters.fat,
		sortBy: sortBy
	});

	const debouncedFilters = useDebounce(() => searchFilters, 350);

	// --- LÓGICA DE BÚSQUEDA Y CARGA ---
	async function fetchRecipes(isNewSearch = false) {
		if (isLoading && !isNewSearch) return;
		isLoading = true;

		const offset = isNewSearch ? 0 : recipes.length;
		const currentFilters = debouncedFilters();

		if (isNewSearch) {
			controller?.abort();
			controller = new AbortController();
		}
		const signal = controller?.signal;

		try {
			const response = await fetch('/api/recipes/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...currentFilters, offset }),
				signal
			});
			const result = await response.json();

			if (signal?.aborted) return;

			if (isNewSearch) {
				recipes = result.recipes;
			} else {
				recipes.push(...result.recipes);
			}
			hasMore = result.hasMore;
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return;
			}
			console.error('Error en la búsqueda:', error);
		} finally {
			if (!signal?.aborted) {
				isLoading = false;
			}
		}
	}

	// Efecto para la búsqueda inicial / por cambio de filtros
	$effect(() => {
		debouncedFilters(); // Dependencia
		fetchRecipes(true);
	});

	// Efecto para el scroll infinito
	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && hasMore && !isLoading) {
				fetchRecipes(false); // Carga la siguiente página
			}
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	});

	// --- MANEJADORES DE EVENTOS ---
	function handleAddIngredient(ingredient: Ingredient) {
		if (!selectedIngredients.some((i) => i.id === ingredient.id)) {
			selectedIngredients.push(ingredient);
		}
	}

	function handleRemoveIngredient(ingredientId: string) {
		selectedIngredients = selectedIngredients.filter((i) => i.id !== ingredientId);
	}
</script>

<div class="container mx-auto p-4 md:p-8">
	<header class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">Búsqueda Avanzada</h1>
		<p class="text-muted-foreground">
			Filtra por ingredientes, macronutrientes y más.
		</p>
	</header>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<aside class="lg:col-span-1">
			<div class="space-y-6 rounded-lg border p-4 sticky top-4">
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">Ingredientes</h3>
					<IngredientCombobox
						onSelect={handleAddIngredient}
						selectedIds={selectedIngredients.map((i) => i.id)}
					/>
					<div class="flex flex-wrap gap-2 pt-2 min-h-[24px]">
						{#each selectedIngredients as ingredient (ingredient.id)}
							<Badge variant="secondary" class="flex items-center gap-2">
								{ingredient.name}
								<button
									onclick={() => handleRemoveIngredient(ingredient.id)}
									class="focus:ring-ring rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
								>
									<X class="h-3 w-3" />
								</button>
							</Badge>
						{/each}
					</div>
				</div>
				<hr />
				<MacroFilters bind:value={macroFilters} />
			</div>
		</aside>

		<main class="lg:col-span-2">
			<div class="space-y-4">
				{#if recipes.length > 0}
					<div class="columns-1 md:columns-2 gap-4">
						{#each recipes as recipe (recipe.id)}
							<div class="mb-4 break-inside-avoid">
								<RecipeCard {recipe} isAdmin={false} onEditQuantities={() => {}} onDelete={() => {}} />
							</div>
						{/each}
					</div>
				{:else if !isLoading}
					<div class="rounded-lg border p-8 text-center">
						<p class="text-muted-foreground">No se encontraron recetas con estos criterios.</p>
					</div>
				{/if}

				{#if hasMore}
					<div bind:this={sentinel} class="h-10 flex justify-center items-center text-muted-foreground">
						{#if isLoading}
							<span>Cargando...</span>
						{/if}
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>
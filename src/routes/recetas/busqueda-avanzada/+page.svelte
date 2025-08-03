<!--
// Fichero: src/routes/recetas/busqueda-avanzada/+page.svelte
// --- VERSIÓN FINAL CON PATRONES SVELTE 5 CORRECTOS ---
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { pushState } from '$app/navigation';
	import IngredientCombobox from '$lib/components/recipes/IngredientCombobox.svelte';
	import MacroFilters from '$lib/components/recipes/MacroFilters.svelte';
	import type {
		GramFilters,
		PercentFilters
	} from '$lib/components/recipes/MacroFilters.svelte';
	import RecipeCard from '$lib/components/recipes/RecipeCard.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import X from 'lucide-svelte/icons/x';

	type Ingredient = { id: string; name: string; type: 'product' | 'custom' };
	type Recipe = any;

	// --- TIPOS LOCALES ---
	type InitialState = {
		selectedIngredients: Ingredient[];
		gramFilters: GramFilters;
		percentFilters: PercentFilters;
		sortBy: string;
	};
	type SearchPayload = {
		ingredients: string[];
		grams: GramFilters;
		percent: PercentFilters;
		sortBy: string;
	};

	// --- ESTADO DE LA UI (HIDRATADO DESDE LA URL) ---
	function getInitialState(): InitialState {
		const params = $page.url.searchParams;
		return {
			selectedIngredients: JSON.parse(params.get('ingredients') || '[]'),
			gramFilters: JSON.parse(
				params.get('grams') || '{"calories":{},"protein":{},"carbs":{},"fat":{}}'
			),
			percentFilters: JSON.parse(
				params.get('percent') || '{"protein":{},"carbs":{},"fat":{}}'
			),
			sortBy: params.get('sortBy') || 'title_asc'
		};
	}
	let { selectedIngredients, gramFilters, percentFilters, sortBy } = $state(getInitialState());

	// --- ESTADO DE RESULTADOS Y CONTROL ---
	let recipes = $state<Recipe[]>([]);
	let isLoading = $state(false);
	let hasMore = $state(true);
	let sentinel: HTMLDivElement | undefined = $state();
	let controller: AbortController | undefined;

	// --- FILTROS DERIVADOS DE LA UI ---
	// Justificación: `$derived` crea un valor reactivo. Se accede a él directamente (ej. `uiFilters`),
	// no se invoca como una función.
	const uiFilters = $derived({
		ingredients: selectedIngredients,
		grams: gramFilters,
		percent: percentFilters,
		sortBy: sortBy
	});

	// --- LÓGICA DE BÚSQUEDA ---
	async function performSearch(filters: SearchPayload) {
		const hasGrams = Object.values(filters.grams).some(
			(range) => range && (range.min != null || range.max != null)
		);
		const hasPercent = Object.values(filters.percent).some(
			(range) => range && (range.min != null || range.max != null)
		);
		const hasMacroFilters = hasGrams || hasPercent;

		if (filters.ingredients.length === 0 && !hasMacroFilters) {
			recipes = [];
			hasMore = false;
			return;
		}

		isLoading = true;
		const signal = controller?.signal;
		try {
			const body = { ...filters, offset: 0 };
			const response = await fetch('/api/recipes/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				signal
			});
			const result = await response.json();
			if (signal?.aborted) return;
			recipes = result.recipes;
			hasMore = result.hasMore;
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			console.error('Error en la búsqueda:', error);
		} finally {
			if (!signal?.aborted) isLoading = false;
		}
	}

	async function loadMore(filters: SearchPayload) {
		if (isLoading) return;
		isLoading = true;
		try {
			const body = { ...filters, offset: recipes.length };
			const response = await fetch('/api/recipes/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const result = await response.json();
			recipes.push(...result.recipes);
			hasMore = result.hasMore;
		} catch (error) {
			console.error('Error al cargar más recetas:', error);
		} finally {
			isLoading = false;
		}
	}

	// --- EFECTOS ---
	$effect(() => {
		if (!browser) return;
		// Se lee el valor de `uiFilters` para establecer la dependencia.
		const filtersToSync = uiFilters;

		controller?.abort();
		controller = new AbortController();

		const timerId = setTimeout(() => {
			// Se transforma el estado de la UI al payload que espera la API.
			const payload: SearchPayload = {
				...filtersToSync,
				ingredients: filtersToSync.ingredients.map((i) => i.id)
			};
			performSearch(payload);

			// Se actualiza la URL con el estado completo de la UI.
			const params = new URLSearchParams();
			if (filtersToSync.ingredients.length > 0) {
				params.set('ingredients', JSON.stringify(filtersToSync.ingredients));
			}
			if (Object.values(filtersToSync.grams).some(v => v && (v.min != null || v.max != null))) {
				params.set('grams', JSON.stringify(filtersToSync.grams));
			}
			if (Object.values(filtersToSync.percent).some(v => v && (v.min != null || v.max != null))) {
				params.set('percent', JSON.stringify(filtersToSync.percent));
			}
			if (filtersToSync.sortBy !== 'title_asc') {
				params.set('sortBy', filtersToSync.sortBy);
			}
			const newUrl = `${$page.url.pathname}?${params.toString()}`;
			pushState(newUrl, {});
		}, 350);

		return () => clearTimeout(timerId);
	});

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && hasMore && !isLoading) {
				const filters = uiFilters;
				const payload: SearchPayload = {
					...filters,
					ingredients: filters.ingredients.map((i) => i.id)
				};
				loadMore(payload);
			}
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	});

	// --- MANEJADORES DE EVENTOS ---
	function handleAddIngredient(ingredient: Ingredient) {
		if (!selectedIngredients.some((i) => i.id === ingredient.id)) {
			selectedIngredients = [...selectedIngredients, ingredient];
		}
	}
	function handleRemoveIngredient(ingredientId: string) {
		selectedIngredients = selectedIngredients.filter((i) => i.id !== ingredientId);
	}
	function clearIngredients() {
		selectedIngredients = [];
	}
</script>

<div class="container mx-auto p-4 md:p-8">
	<header class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Búsqueda Avanzada</h1>
			<p class="text-muted-foreground">
				Filtra por ingredientes, macronutrientes y más.
			</p>
		</div>
	</header>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<aside class="lg:col-span-1">
			<div class="space-y-6 rounded-lg border p-4 sticky top-4">
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">Ingredientes</h3>
					<IngredientCombobox
						onSelect={handleAddIngredient}
						selectedIds={selectedIngredients.map((i) => i.id)}
						onClear={clearIngredients}
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
				<MacroFilters bind:gramFilters bind:percentFilters />
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
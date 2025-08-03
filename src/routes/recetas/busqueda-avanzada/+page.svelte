<script lang="ts">
	import { browser } from '$app/environment';
	import IngredientCombobox from '$lib/components/recipes/IngredientCombobox.svelte';
	import MacroFilters from '$lib/components/recipes/MacroFilters.svelte';
	import type {
		GramFilters,
		PercentFilters
	} from '$lib/components/recipes/MacroFilters.svelte';
	import RecipeCard from '$lib/components/recipes/RecipeCard.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import X from 'lucide-svelte/icons/x';

	type Ingredient = {
		id: string;
		name: string;
		type: 'product' | 'custom';
		source: 'local' | 'off';
		imageUrl: string | null;
	};
	type Recipe = any;

	// --- TIPOS LOCALES ---
	type SearchPayload = {
		ingredients: string[];
		grams: GramFilters;
		percent: PercentFilters;
		sortBy: string;
	};

	// --- ESTADO DE FILTROS (LA "CAUSA") ---
	let filters = $state({
		selectedIngredients: [] as Ingredient[],
		gramFilters: { calories: {}, protein: {}, carbs: {}, fat: {} } as GramFilters,
		percentFilters: { protein: {}, carbs: {}, fat: {} } as PercentFilters,
		sortBy: 'title_asc'
	});

	// --- ESTADO DE RESULTADOS Y UI (EL "EFECTO") ---
	let recipes = $state<Recipe[]>([]);
	let isLoading = $state(false);
	let hasMore = $state(false);
	let sentinel: HTMLDivElement | undefined = $state();
	let controller: AbortController | undefined;

	// --- FUNCIÓN DE COMPROBACIÓN (en lugar de $derived) ---
	// Justificación: Se usa una función pura para evitar condiciones de carrera
	// en la inicialización de los $derived stores, garantizando que el estado
	// se compruebe en el momento exacto de la ejecución del efecto.
	function areFiltersActive() {
		const hasMacroGrams = Object.values(filters.gramFilters).some(
			(range) => range && (range.min != null || range.max != null)
		);
		const hasMacroPercent = Object.values(filters.percentFilters).some(
			(range) => range && (range.min != null || range.max != null)
		);
		return filters.selectedIngredients.length > 0 || hasMacroGrams || hasMacroPercent;
	}

	// --- LÓGICA DE BÚSQUEDA ---
	async function performSearch(payload: SearchPayload) {
		if (!areFiltersActive()) {
			recipes = [];
			hasMore = false;
			return;
		}

		isLoading = true;
		const signal = controller?.signal;
		try {
			const body = { ...payload, offset: 0 };
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

	async function loadMore(payload: SearchPayload) {
		if (!areFiltersActive() || isLoading) return;
		isLoading = true;
		try {
			const body = { ...payload, offset: recipes.length };
			const response = await fetch('/api/recipes/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const result = await response.json();
			recipes.push(...result.recipes);
			hasMore = result.hasMore;
		} catch (error)
		{
			console.error('Error al cargar más recetas:', error);
		} finally {
			isLoading = false;
		}
	}

	// --- EFECTOS ---
	$effect(() => {
		if (!browser) return;

		if (!areFiltersActive()) {
			recipes = [];
			hasMore = false;
			return;
		}

		controller?.abort();
		controller = new AbortController();

		const payload: SearchPayload = {
			ingredients: filters.selectedIngredients.map((i) => i.id),
			grams: filters.gramFilters,
			percent: filters.percentFilters,
			sortBy: filters.sortBy
		};

		const timerId = setTimeout(() => {
			performSearch(payload);
		}, 350);

		return () => clearTimeout(timerId);
	});

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && hasMore && !isLoading && areFiltersActive()) {
				const payload: SearchPayload = {
					ingredients: filters.selectedIngredients.map((i) => i.id),
					grams: filters.gramFilters,
					percent: filters.percentFilters,
					sortBy: filters.sortBy
				};
				loadMore(payload);
			}
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	});

	// --- MANEJADORES DE EVENTOS ---
	function handleAddIngredient(ingredient: Ingredient) {
		if (!filters.selectedIngredients.some((i) => i.id === ingredient.id)) {
			filters.selectedIngredients = [...filters.selectedIngredients, ingredient];
		}
	}
	function handleRemoveIngredient(ingredientId: string) {
		filters.selectedIngredients = filters.selectedIngredients.filter((i) => i.id !== ingredientId);
	}
	function clearIngredients() {
		filters.selectedIngredients = [];
	}
	function handleGramsChange(macro: keyof GramFilters, key: 'min' | 'max', value: number | undefined) {
		filters.gramFilters = {
			...filters.gramFilters,
			[macro]: {
				...filters.gramFilters[macro],
				[key]: value
			}
		};
	}
	function handlePercentChange(
		macro: keyof PercentFilters,
		key: 'min' | 'max',
		value: number | undefined
	) {
		filters.percentFilters = {
			...filters.percentFilters,
			[macro]: {
				...filters.percentFilters[macro],
				[key]: value
			}
		};
	}
	function handleClearMacros() {
		filters.gramFilters = { calories: {}, protein: {}, carbs: {}, fat: {} };
		filters.percentFilters = { protein: {}, carbs: {}, fat: {} };
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
						selectedIds={filters.selectedIngredients.map((i) => i.id)}
						onClear={clearIngredients}
					/>
					<div class="flex flex-wrap gap-2 pt-2 min-h-[24px]">
						{#each filters.selectedIngredients as ingredient (ingredient.id)}
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
				<MacroFilters
					gramFilters={filters.gramFilters}
					percentFilters={filters.percentFilters}
					onGramsChange={handleGramsChange}
					onPercentChange={handlePercentChange}
					onClear={handleClearMacros}
				/>
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
						<p class="text-muted-foreground">
							{#if areFiltersActive()}
								No se encontraron recetas con estos criterios.
							{:else}
								Selecciona uno o más filtros para empezar a buscar.
							{/if}
						</p>
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

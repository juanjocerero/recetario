<script lang="ts">
	// --- LECCIONES APRENDIDAS Y PATRONES DE SVELTE 5 ---
	// Este componente ha sido objeto de una depuración intensiva que ha revelado
	// varias sutilezas importantes sobre Svelte 5 y SvelteKit. A continuación,
	// se documentan los patrones clave utilizados y las lecciones aprendidas.
	//
	// 1. GESTIÓN DEL ESTADO:
	//    - Se utiliza `$state` para toda la información que puede cambiar y debe
	//      provocar una actualización de la UI.
	//    - El estado se divide conceptualmente entre la "causa" (los filtros que
	//      el usuario modifica) y el "efecto" (los resultados de la búsqueda y
	//      el estado de la UI, como `isLoading`). Esto mejora la claridad del
	//      flujo de datos.
	//
	// 2. EL PROBLEMA DE LA CARGA INICIAL (BUG RESUELTO):
	//    - PROBLEMA: Inicialmente, la página mostraba brevemente todas las recetas
	//      antes de vaciar la lista. Esto ocurría porque la lógica del scroll
	//      infinito se activaba prematuramente.
	//    - SOLUCIÓN: La variable `hasMore` se inicializa en `false`. Esto previene
	//      que el `div` "sentinel" del IntersectionObserver se renderice en la
	//      carga inicial, evitando así la llamada a `loadMore()` con filtros vacíos.
	//
	// 3. PERSISTENCIA DE ESTADO EN NAVEGACIÓN (`snapshot`):
	//    - PROBLEMA: Se necesita mantener el estado de la búsqueda (filtros y
	//      resultados) cuando el usuario navega a una receta y vuelve atrás.
	//    - INTENTO FALLIDO 1: Usar `history.replaceState` directamente. Esto entra
	//      en conflicto con el router de SvelteKit, que es el dueño del historial,
	//      provocando warnings y comportamiento errático.
	//    - INTENTO FALLIDO 2: Usar `replaceState` de `$app/navigation` en un `$effect`.
	//      Esto causó un bucle infinito porque el efecto dependía de datos (`$page`)
	//      que él mismo modificaba, y además provocaba un "hydration mismatch"
	//      al intentar restaurar el estado antes de que el componente se montara
	//      de forma consistente en el cliente y el servidor.
	//    - SOLUCIÓN CORRECTA: Utilizar el objeto `snapshot` exportado. SvelteKit
	//      gestiona este ciclo de vida de forma segura:
	//        - `capture()`: Se llama ANTES de salir de la página. Guardamos una
	//          copia del estado. SvelteKit se encarga de almacenarla.
	//        - `restore()`: Se llama AL VOLVER a la página. SvelteKit nos devuelve
	//          los datos que guardamos para que podamos restaurar el estado.
	//      Este es el patrón canónico y robusto para la persistencia de estado
	//      de UI en SvelteKit.
	//
	// 4. REACTIVIDAD: `$derived` vs. FUNCIONES PURAS:
	//    - PROBLEMA: Durante la depuración, se sospechó de una condición de carrera
	//      en la inicialización de los `$derived` stores, donde un `$effect` podía
	//      ejecutarse antes de que el valor derivado se hubiera estabilizado.
	//    - SOLUCIÓN DE DEPURACIÓN: Reemplazar `$derived` por una función pura
	//      (`areFiltersActive()`) para asegurar que el cálculo se realizara en el
	//      momento exacto de la llamada. Esto resolvió el problema, confirmando
	//      la hipótesis de la condición de carrera.
	//    - CONCLUSIÓN: Aunque `$derived` es potente, para lógica crítica que se
	//      ejecuta en la inicialización y que controla si se realizan o no
	//      peticiones de red, una función pura puede ser más segura y predecible,
	//      evitando posibles bugs de timing en el ciclo de vida.
	//
	// 5. COMUNICACIÓN ENTRE COMPONENTES:
	//    - Se sigue un patrón de "callbacks" (eventos). El componente padre
	//      (`+page.svelte`) mantiene la propiedad del estado (`filters`) y pasa
	//      funciones (`onGramsChange`, etc.) al hijo (`MacroFilters.svelte`).
	//    - El hijo, en lugar de modificar los datos directamente (lo que Svelte 5
	//      desaconseja y marca con un warning), llama a estas funciones para
	//      notificar al padre de que debe realizar un cambio. Esto mantiene un
	//      flujo de datos unidireccional y predecible.

	import { browser } from '$app/environment';
	import IngredientCombobox from '$lib/components/recipes/IngredientCombobox.svelte';
	import MacroFilters from '$lib/components/recipes/MacroFilters.svelte';
	import SortOptions from '$lib/components/recipes/SortOptions.svelte';
	import type {
		SortField,
		SortDirection
	} from '$lib/components/recipes/SortOptions.svelte';
	import type {
		GramFilters,
		PercentFilters
	} from '$lib/components/recipes/MacroFilters.svelte';
	import RecipeCard from '$lib/components/recipes/RecipeCard.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import X from 'lucide-svelte/icons/x';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { cn } from '$lib/utils';

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

	let sortField = $state<SortField>('title');
	let sortDirection = $state<SortDirection>('asc');

	// Efecto para sincronizar la UI de ordenación con el estado de los filtros.
	$effect(() => {
		const newSortBy = `${sortField}_${sortDirection}`;
		if (filters.sortBy !== newSortBy) {
			filters.sortBy = newSortBy;
		}
	});

	// --- ESTADO DE RESULTADOS Y UI (EL "EFECTO") ---
	let recipes = $state<Recipe[]>([]);
	let isLoading = $state(false);
	let hasMore = $state(false);
	let sentinel: HTMLDivElement | undefined = $state();
	let controller: AbortController | undefined;
	let pageHeader: HTMLElement | undefined = $state();
	let isDesktop = $state(false);

	$effect(() => {
		if (!browser) return;

		const mediaQuery = window.matchMedia('(min-width: 1024px)');
		isDesktop = mediaQuery.matches;

		const listener = (e: MediaQueryListEvent) => (isDesktop = e.matches);
		mediaQuery.addEventListener('change', listener);

		return () => mediaQuery.removeEventListener('change', listener);
	});

	// --- PERSISTENCIA DE ESTADO CON SNAPSHOT ---
	// Este es el mecanismo oficial de SvelteKit para guardar y restaurar el estado
	// de un componente durante la navegación del historial (ej. botón "atrás").
	export const snapshot = {
		capture: () => {
			// SvelteKit llama a esta función ANTES de que el usuario navegue fuera de esta página.
			// Devolvemos un objeto serializable con los datos que queremos preservar.
			// Usamos JSON.parse/stringify para crear una copia profunda y evitar problemas de referencias.
			return {
				filters: JSON.parse(JSON.stringify(filters)),
				recipes: JSON.parse(JSON.stringify(recipes))
			};
		},
		restore: (data: any) => {
			// SvelteKit llama a esta función CUANDO el usuario vuelve a esta página.
			// 'data' es el objeto que devolvimos en `capture`.
			// Restauramos el estado del componente con estos datos.
			if (data && data.filters && data.recipes) {
				filters = data.filters;
				recipes = data.recipes;
			}
		}
	};

	// --- FUNCIÓN DE COMPROBACIÓN ---
	// Se utiliza una función pura en lugar de un `$derived` store para determinar si hay filtros activos.
	// Esto resolvió un bug de condición de carrera donde los `$effect` se ejecutaban
	// antes de que el valor de `$derived` se estabilizara en la carga inicial.
	// Llamar a una función nos da la garantía de que el cálculo se hace en el momento preciso.
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
		// Guardia de seguridad para no hacer peticiones a la API sin filtros.
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
			pageHeader?.scrollIntoView({ behavior: 'smooth' });
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			console.error('Error en la búsqueda:', error);
		} finally {
			if (!signal?.aborted) isLoading = false;
		}
	}

	async function loadMore(payload: SearchPayload) {
		// Doble guardia: no cargar más si no hay filtros o si ya se está cargando.
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
		} catch (error) {
			console.error('Error al cargar más recetas:', error);
		} finally {
			isLoading = false;
		}
	}
	
	// --- EFECTOS ---

	// Efecto principal para la búsqueda. Se activa cuando los filtros cambian.
	$effect(() => {
		if (!browser) return;

		// Si no hay filtros, se limpia el estado de los resultados.
		// Esto previene una búsqueda en la carga inicial.
		if (!areFiltersActive()) {
			recipes = [];
			hasMore = false;
			return;
		}
		// AbortController para cancelar peticiones en curso si el usuario sigue escribiendo.
		controller?.abort();
		controller = new AbortController();
		const payload: SearchPayload = {
			ingredients: filters.selectedIngredients.map((i) => i.id),
			grams: filters.gramFilters,
			percent: filters.percentFilters,
			sortBy: filters.sortBy
		};
		// Debounce para no lanzar una petición en cada pulsación de tecla.
		const timerId = setTimeout(() => {
			performSearch(payload);
		}, 350);
		// Función de limpieza: se ejecuta antes de la siguiente ejecución del efecto.
		return () => clearTimeout(timerId);
	});

	// Efecto para el scroll infinito.
	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver((entries) => {
			// Solo carga más si el sentinel es visible, hay más resultados, no se está
			// cargando ya, y (crucialmente) hay filtros activos.
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
	// Estos manejadores actualizan el estado `filters` de forma inmutable,
	// lo que garantiza que la reactividad de Svelte 5 se dispare correctamente.
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

<div class="container mx-auto p-4 md:py-8 md:px-24">
	<header class="mb-8 flex items-center justify-between" bind:this={pageHeader}>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Búsqueda Avanzada</h1>
			<p class="text-muted-foreground">
				Filtra por productos, macronutrientes y más.
			</p>
		</div>
	</header>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<aside class="lg:col-span-1 space-y-6 sticky top-4">
			<Collapsible.Root open={isDesktop} class="border rounded-lg p-4">
				<div class="flex items-center justify-between">
					<h3 class="text-xl font-semibold">Filtros</h3>
					<Collapsible.Trigger
						class={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-9 p-0')}
					>
						<ChevronsUpDown class="h-4 w-4" />
						<span class="sr-only">Toggle Filtros</span>
					</Collapsible.Trigger>
				</div>
				<Collapsible.Content class="mt-4">
					<div class="space-y-6">
						<div class="space-y-2">
							<h3 class="text-lg font-semibold">Productos</h3>
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
				</Collapsible.Content>
			</Collapsible.Root>

			<Collapsible.Root open={isDesktop} class="border rounded-lg p-4">
				<div class="flex items-center justify-between">
					<h3 class="text-xl font-semibold">Ordenar por</h3>
					<Collapsible.Trigger
						class={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-9 p-0')}
					>
						<ChevronsUpDown class="h-4 w-4" />
						<span class="sr-only">Toggle Ordenar</span>
					</Collapsible.Trigger>
				</div>
				<Collapsible.Content class="mt-4">
					<SortOptions
						field={sortField}
						direction={sortDirection}
						onFieldChange={(value) => (sortField = value)}
						onDirectionChange={(value) => (sortDirection = value)}
					/>
				</Collapsible.Content>
			</Collapsible.Root>
		</aside>

		<main class="lg:col-span-2">
			<div class="space-y-4">
				{#if recipes.length > 0}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each recipes as recipe, i (recipe.id)}
							<div>
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

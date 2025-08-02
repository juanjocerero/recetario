<!--
// Fichero: src/routes/+page.svelte
// --- VERSIÓN FINAL CON PATRONES AVANZADOS DE SVELTE 5 ---
-->
<script lang="ts">
	import RecipeCard from '$lib/components/recipes/RecipeCard.svelte';
	import EditQuantitiesDialog from '$lib/components/recipes/EditQuantitiesDialog.svelte';
	import DeleteRecipeDialog from '$lib/components/recipes/DeleteRecipeDialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Plus from 'lucide-svelte/icons/plus';
	import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';
	import { useDebounce } from '$lib/runes/useDebounce.svelte';

	const RECIPES_PER_PAGE = 50;

	let { data } = $props();
	type Recipe = (typeof data.recipes)[number];

	// --- ESTADO REACTIVO (Svelte 5) ---
	let recipes = $state(data.recipes);
	let searchQuery = $state('');
	let isLoading = $state(false);
	let hasMore = $state(data.hasMore);

	let selectedRecipe = $state<Recipe | null>(null);
	let isEditDialogOpen = $state(false);
	let isDeleteDialogOpen = $state(false);

	const isAdmin = $derived(!!data.user?.isAdmin);

	// --- LÓGICA DE CARGA Y BÚSQUEDA ---
	let sentinel: HTMLDivElement | undefined = $state();

	// Justificación (Debounce Moderno): Se utiliza nuestra utilidad `useDebounce` para
	// crear una señal reactiva que solo se actualiza 300ms después de que el usuario
	// deja de escribir, optimizando las peticiones a la API.
	const debouncedSearchQuery = useDebounce(() => searchQuery, 300);

	async function fetchRecipes(isSearch = false) {
		if (isLoading) return;
		isLoading = true;

		const offset = isSearch ? 0 : recipes.length;
		const query = isSearch ? debouncedSearchQuery() : searchQuery;
		const url = `/api/recipes?q=${encodeURIComponent(query)}&limit=${RECIPES_PER_PAGE}&offset=${offset}`;

		try {
			const response = await fetch(url);
			const result = await response.json();

			if (isSearch) {
				recipes = result.recipes;
			} else {
				recipes.push(...result.recipes);
			}
			hasMore = result.hasMore;
		} catch (error) {
			console.error('Error al cargar recetas:', error);
		} finally {
			isLoading = false;
		}
	}

	// Justificación (Búsqueda con $effect): Este efecto se ejecuta automáticamente
	// cada vez que la señal `debouncedSearchQuery` cambia. Es la forma idiomática
	// en Svelte 5 de reaccionar a cambios de estado para ejecutar lógica asíncrona.
	$effect(() => {
		// Para evitar una llamada inicial innecesaria, registramos el valor.
		const query = debouncedSearchQuery();
		fetchRecipes(true);
	});

	// Justificación (Scroll Infinito con $effect): Se usa `$effect` para manejar el
	// ciclo de vida del IntersectionObserver. Es más robusto que `onMount` porque
	// su función de limpieza se ejecuta automáticamente, previniendo memory leaks.
	$effect(() => {
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoading) {
					fetchRecipes();
				}
			},
			{ threshold: 1.0 }
		);

		observer.observe(sentinel);

		// La función de limpieza del efecto se encarga de desconectar el observador.
		return () => observer.disconnect();
	});

	function handleOpenEditDialog(recipe: Recipe) {
		selectedRecipe = recipe;
		isEditDialogOpen = true;
	}

	function handleOpenDeleteDialog(recipe: Recipe) {
		selectedRecipe = recipe;
		isDeleteDialogOpen = true;
	}
</script>

<div class="container mx-auto p-4 md:p-8">
	<header class="flex items-center justify-between gap-2 mb-8">
		<div class="relative flex-grow">
			<Input bind:value={searchQuery} placeholder="Buscar por receta o ingrediente..." />
		</div>
		<Button href="/recetas/busqueda-avanzada" variant="ghost" size="icon" aria-label="Búsqueda avanzada">
			<SlidersHorizontal class="h-4 w-4" />
		</Button>
		<Button href="/recetas/nueva">
			<Plus class="mr-2 h-4 w-4" />
			Añadir Receta
		</Button>
	</header>

	<main class="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
		{#each recipes as recipe (recipe.id)}
			<div class="mb-4 break-inside-avoid">
				<RecipeCard
					{recipe}
					{isAdmin}
					onEditQuantities={() => handleOpenEditDialog(recipe)}
					onDelete={() => handleOpenDeleteDialog(recipe)}
				/>
			</div>
		{/each}
	</main>

	{#if hasMore}
		<div bind:this={sentinel} class="h-10 text-center text-muted-foreground">
			{#if isLoading}
				Cargando más recetas...
			{/if}
		</div>
	{/if}

	{#if recipes.length === 0 && !isLoading}
		<div class="col-span-full text-center py-16 text-muted-foreground">
			<p class="text-lg font-medium">No se encontraron recetas.</p>
			<p>Prueba con otro término de búsqueda o añade una nueva receta.</p>
		</div>
	{/if}
</div>

<EditQuantitiesDialog
	recipe={selectedRecipe}
	bind:open={isEditDialogOpen}
	onOpenChange={(isOpen: boolean) => (isEditDialogOpen = isOpen)}
/>

<DeleteRecipeDialog
	recipe={selectedRecipe}
	bind:open={isDeleteDialogOpen}
	onOpenChange={(isOpen: boolean) => (isDeleteDialogOpen = isOpen)}
/>
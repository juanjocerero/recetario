<!--
Fichero: src/routes/+page.svelte
-->
<script lang="ts">
	import RecipeCard from '$lib/components/recipes/RecipeCard.svelte';
	import EditQuantitiesDialog from '$lib/components/recipes/EditQuantitiesDialog.svelte';
	import DeleteRecipeDialog from '$lib/components/recipes/DeleteRecipeDialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Plus from 'lucide-svelte/icons/plus';
	import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';
	
	const RECIPES_PER_PAGE = 50;
	
	let { data } = $props();
	type Recipe = (typeof data.recipes)[number];
	
	// --- ESTADO REACTIVO ---
	let recipes = $state(data.recipes);
	let searchQuery = $state('');
	let isLoading = $state(false);
	let hasMore = $state(data.hasMore);
	let sentinel: HTMLDivElement | undefined = $state();
	let controller: AbortController;
	
	let selectedRecipe = $state<Recipe | null>(null);
		let isEditDialogOpen = $state(false);
		let isDeleteDialogOpen = $state(false);
		
		const isAdmin = $derived(data.user?.role === 'admin');
		
		// --- LÓGICA DE CARGA Y BÚSQUEDA ---
		async function fetchRecipes(isNewSearch = false) {
			if (isLoading && !isNewSearch) return;
			isLoading = true;
			
			const offset = isNewSearch ? 0 : recipes.length;
			
			// Justificación: Se usa AbortController para la búsqueda simple, manteniendo
			// la consistencia con la búsqueda avanzada y previniendo race conditions.
			if (isNewSearch) {
				controller?.abort();
				controller = new AbortController();
			}
			const signal = controller?.signal;
			
			const url = `/api/recipes?q=${encodeURIComponent(searchQuery)}&limit=${RECIPES_PER_PAGE}&offset=${offset}`;
			
			try {
				const response = await fetch(url, { signal });
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
				console.error('Error al cargar recetas:', error);
			} finally {
				if (!signal?.aborted) {
					isLoading = false;
				}
			}
		}
		
		$effect(() => {
			searchQuery; // Dependencia del efecto
			const handler = setTimeout(() => {
				fetchRecipes(true);
			}, 300); // Se mantiene un pequeño debounce aquí para no lanzar búsquedas en cada letra
			return () => clearTimeout(handler);
		});
		
		$effect(() => {
			if (!sentinel) return;
			const observer = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoading) {
					fetchRecipes();
				}
			});
			observer.observe(sentinel);
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
	
	<div class="container mx-auto px-4 md:px-24 mt-16 md:mt-4">
		<header class="flex items-center justify-between gap-2 mb-8">
			<div class="relative flex-grow">
				<Input bind:value={searchQuery} placeholder="Buscar por receta o producto..." />
			</div>
			<Button href="/recetas/busqueda-avanzada" variant="ghost" size="icon" aria-label="Búsqueda avanzada">
				<SlidersHorizontal class="h-4 w-4" />
			</Button>
			<Button href="/recetas/nueva">
				<Plus class="h-4 w-4" />
			</Button>
		</header>
		
		<main class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each recipes as recipe, i (recipe.id)}
			<div>
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
		<div bind:this={sentinel} class="h-10 flex justify-center items-center text-muted-foreground">
			{#if isLoading}
			<span>Cargando...</span>
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
	
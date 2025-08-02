<!--
// Fichero: src/routes/+page.svelte
// Esta es la página principal de la aplicación, que actúa como un dashboard de recetas.
// --- VERSIÓN MEJORADA CON BUSCADOR ---
-->
<script lang="ts">
	import RecipeCard from '$lib/components/recipes/RecipeCard.svelte';
	import EditQuantitiesDialog from '$lib/components/recipes/EditQuantitiesDialog.svelte';
	import DeleteRecipeDialog from '$lib/components/recipes/DeleteRecipeDialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Plus from 'lucide-svelte/icons/plus';
	import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';

	let { data } = $props();
	type Recipe = (typeof data.recipes)[number];

	// --- ESTADO DEL BUSCADOR ---
	let searchQuery = $state('');

	// --- ESTADO DE LOS DIÁLOGOS ---
	let selectedRecipe = $state<Recipe | null>(null);
	let isEditDialogOpen = $state(false);
	let isDeleteDialogOpen = $state(false);

	// --- VALORES DERIVADOS ---
	const isAdmin = $derived(!!data.user?.isAdmin);

	// Justificación: Se crea una lista de recetas derivada. Esta se recalculará
	// automáticamente cada vez que `searchQuery` cambie, proporcionando un
	// filtrado instantáneo en el lado del cliente.
	const filteredRecipes = $derived((() => {
		const searchTerm = searchQuery.toLowerCase().trim();
		if (!searchTerm) {
			return data.recipes;
		}

		return data.recipes.filter((recipe) => {
			// Búsqueda en el título de la receta
			const titleMatch = recipe.title.toLowerCase().includes(searchTerm);

			// Búsqueda en los ingredientes de la receta
			const ingredientMatch = recipe.ingredients.some((ing) => {
				const ingredientName = ing.product?.name || ing.customIngredient?.name || '';
				return ingredientName.toLowerCase().includes(searchTerm);
			});

			return titleMatch || ingredientMatch;
		});
	})());

	// --- MANEJADORES DE EVENTOS ---
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
		<!-- Justificación: El contenedor del buscador ahora usa `flex-grow` para ocupar el espacio disponible. -->
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

	<!-- Justificación: El `each` ahora itera sobre la lista `filteredRecipes`. -->
	<main class="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
		{#if filteredRecipes.length > 0}
			{#each filteredRecipes as recipe (recipe.id)}
				<div class="mb-4 break-inside-avoid">
					<RecipeCard
						{recipe}
						{isAdmin}
						onEditQuantities={() => handleOpenEditDialog(recipe)}
						onDelete={() => handleOpenDeleteDialog(recipe)}
					/>
				</div>
			{/each}
		{:else}
			<!-- Justificación: El mensaje de estado vacío ahora es dinámico. -->
			<div class="col-span-full text-center py-16 text-muted-foreground">
				{#if data.recipes.length === 0}
					<p class="text-lg font-medium">No hay recetas todavía.</p>
					<p>¡Añade una para empezar!</p>
				{:else}
					<p class="text-lg font-medium">No se encontraron recetas.</p>
					<p>Prueba con otro término de búsqueda.</p>
				{/if}
			</div>
		{/if}
	</main>
</div>

<EditQuantitiesDialog
	recipe={selectedRecipe}
	bind:open={isEditDialogOpen}
	onOpenChange={(isOpen) => (isEditDialogOpen = isOpen)}
/>

<DeleteRecipeDialog
	recipe={selectedRecipe}
	bind:open={isDeleteDialogOpen}
	onOpenChange={(isOpen) => (isDeleteDialogOpen = isOpen)}
/>

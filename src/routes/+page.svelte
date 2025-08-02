<!--
// Fichero: src/routes/+page.svelte
// Esta es la página principal de la aplicación, que actúa como un dashboard de recetas.
// --- VERSIÓN CORREGIDA (2) ---
-->
<script lang="ts">
	import RecipeCard from '$lib/components/recipes/RecipeCard.svelte';
	import EditQuantitiesDialog from '$lib/components/recipes/EditQuantitiesDialog.svelte';
	import DeleteRecipeDialog from '$lib/components/recipes/DeleteRecipeDialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Plus from 'lucide-svelte/icons/plus';

	// --- PROPS (Svelte 5) ---
	let { data } = $props();

	// --- TIPOS ---
	type Recipe = (typeof data.recipes)[number];

	// --- ESTADO LOCAL (Svelte 5) ---
	let selectedRecipe = $state<Recipe | null>(null);
	let isEditDialogOpen = $state(false);
	let isDeleteDialogOpen = $state(false);

	// --- VALORES DERIVADOS ---
	// Justificación: Se crea una variable derivada y explícitamente booleana para isAdmin.
	// Esto resuelve el error de tipado al comprobar de forma segura la existencia de
	// `data.user` y su propiedad `isAdmin`, evitando la ambigüedad de tipos.
	const isAdmin = $derived(!!data.user?.isAdmin);

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
	<header class="flex items-center justify-between gap-4 mb-8">
		<div class="relative w-full max-w-sm">
			<Input placeholder="Buscar recetas..." class="pr-10" />
		</div>
		<Button href="/recetas/nueva">
			<Plus class="mr-2 h-4 w-4" />
			Añadir Receta
		</Button>
	</header>

	<main class="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
		{#if data.recipes.length > 0}
			{#each data.recipes as recipe (recipe.id)}
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
			<div class="col-span-full text-center py-16 text-muted-foreground">
				<p class="text-lg font-medium">No hay recetas todavía.</p>
				<p>¡Añade una para empezar!</p>
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
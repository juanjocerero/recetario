<!--
Fichero: src/lib/components/recipes/RecipeCard.svelte
Este componente representa una única tarjeta de receta en la vista principal.
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { calculateNutritionalInfo } from '$lib/recipeCalculator';
	import type { CalculableProduct } from '$lib/recipeCalculator';
	
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';
	import MacroBar from '$lib/components/shared/MacroBar.svelte';
	
	// Justificación: El tipo ahora usa `title` para coincidir con el esquema de Prisma.
	type Recipe = {
		id: string;
		slug: string;
		title: string;
		imageUrl: string | null;
		ingredients: {
			quantity: number;
			product: {
				calories: number | null;
				protein: number | null;
				fat: number | null;
				carbs: number | null;
			};
		}[];
	};
	
	// --- PROPS (Svelte 5) ---
	let { recipe, isAdmin, onEditQuantities, onDelete }: {
		recipe: Recipe;
		isAdmin: boolean;
		onEditQuantities: (recipe: Recipe) => void;
		onDelete: (recipe: Recipe) => void;
	} = $props();
	
	// --- STATE (Svelte 5) ---
	let menuOpen = $state(false);
	
	// --- LÓGICA DE CÁLCULO ---
	const calculableProducts = $derived(
	recipe.ingredients.map((ing) => {
		const source = ing.product;
		return {
			quantity: ing.quantity,
			calories: source.calories,
			protein: source.protein,
			fat: source.fat,
			carbs: source.carbs
		} as CalculableProduct;
	})
	);
	
	const totals = $derived(calculateNutritionalInfo(calculableProducts));
	
	function handleEditQuantities(event: MouseEvent) {
		event.preventDefault();
		onEditQuantities(recipe);
		menuOpen = false;
	}
	
	function handleDelete(event: MouseEvent) {
		event.preventDefault();
		onDelete(recipe);
		menuOpen = false;
	}
</script>

<Card.Root class="flex flex-col break-inside-avoid rounded-lg border bg-card">
	<a
		href="/recetas/{recipe.slug}"
		class="relative z-0 flex h-full flex-col"
		aria-label="Ver receta: {recipe.title}"
	>
		<div class="relative">
			{#if recipe.imageUrl}
			<img
			src="{`${base}${recipe.imageUrl}`}"
			alt="Imagen de {recipe.title}"
			class="aspect-video w-full rounded-t-lg object-cover"
			/>
			{/if}
			
			{#if isAdmin}
			<div class="absolute top-2 right-2">
				<DropdownMenu bind:open={menuOpen}>
					<DropdownMenuTrigger
					class="bg-background/60 hover:bg-background/80 backdrop-blur-sm rounded-full h-8 w-8 inline-flex items-center justify-center"
					onclick={(e: MouseEvent) => {
						e.stopPropagation();
						e.preventDefault();
					}}
					aria-label="Abrir menú de acciones para {recipe.title}"
					>
					<MoreVertical class="h-4 w-4" />
				</DropdownMenuTrigger>
				<DropdownMenuContent
				class="w-48"
				align="end"
				onclick={(e: MouseEvent) => e.stopPropagation()}
				>
				<DropdownMenuItem onclick={handleEditQuantities}>
					Editar cantidades
				</DropdownMenuItem>
				<DropdownMenuItem>
					<a href="/recetas/{recipe.slug}/editar" class="w-full">Editar receta</a>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onclick={handleDelete} class="text-destructive focus:text-destructive">
					Eliminar
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</div>
	{/if}
</div>

<Card.Header>
	<Card.Title class="font-heading text-lg text-light pt-2">{recipe.title}</Card.Title>
	<Card.Description class="py-2">{totals.totalCalories.toFixed(0)} kcal</Card.Description>
</Card.Header>

<Card.Content class="flex-grow">
	<MacroBar protein={totals.totalProtein} carbs={totals.totalCarbs} fat={totals.totalFat} />
</Card.Content>
</a>
</Card.Root>

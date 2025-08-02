<!--
// Fichero: src/lib/components/recipes/RecipeCard.svelte
// Este componente representa una única tarjeta de receta en la vista principal.
// --- VERSIÓN CORREGIDA (5) PARA SVELTE 5 ---
-->
<script lang="ts">
	import { calculateNutritionalInfo } from '$lib/recipeCalculator';
	import type { CalculableIngredient } from '$lib/recipeCalculator';

	import * as Card from '$lib/components/ui/card/index.js';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';

	// Justificación: El tipo ahora usa `title` para coincidir con el esquema de Prisma.
	type Recipe = {
		id: string;
		title: string;
		imageUrl: string | null;
		ingredients: {
			quantity: number;
			product: {
				calories: number | null;
				protein: number | null;
				fat: number | null;
				carbs: number | null;
			} | null;
			customIngredient: {
				calories: number | null;
				protein: number | null;
				fat: number | null;
				carbs: number | null;
			} | null;
		}[];
	};

	// --- PROPS (Svelte 5) ---
	let { recipe, isAdmin, onEditQuantities, onDelete }: {
		recipe: Recipe;
		isAdmin: boolean;
		onEditQuantities: (recipe: Recipe) => void;
		onDelete: (recipe: Recipe) => void;
	} = $props();

	// --- LÓGICA DE CÁLCULO ---
	const calculableIngredients = $derived(
		recipe.ingredients.map((ing) => {
			const source = ing.product || ing.customIngredient;
			return {
				quantity: ing.quantity,
				calories: source?.calories,
				protein: source?.protein,
				fat: source?.fat,
				carbs: source?.carbs
			} as CalculableIngredient;
		})
	);

	const totals = $derived(calculateNutritionalInfo(calculableIngredients));
	const totalGrams = $derived(totals.totalProtein + totals.totalCarbs + totals.totalFat);

	const proteinPercentage = $derived(totalGrams > 0 ? (totals.totalProtein / totalGrams) * 100 : 0);
	const carbsPercentage = $derived(totalGrams > 0 ? (totals.totalCarbs / totalGrams) * 100 : 0);
	const fatPercentage = $derived(totalGrams > 0 ? (totals.totalFat / totalGrams) * 100 : 0);

	function handleEditQuantities(event: MouseEvent) {
		event.preventDefault();
		onEditQuantities(recipe);
	}

	function handleDelete(event: MouseEvent) {
		event.preventDefault();
		onDelete(recipe);
	}
</script>

<Card.Root class="flex flex-col break-inside-avoid">
	<a href="/recetas/{recipe.id}" class="flex flex-col h-full" aria-label="Ver receta: {recipe.title}">
		<div class="relative">
			{#if recipe.imageUrl}
				<img
					src={recipe.imageUrl}
					alt="Imagen de {recipe.title}"
					class="aspect-video w-full rounded-t-lg object-cover"
				/>
			{/if}

			{#if isAdmin}
				<div class="absolute top-2 right-2">
					<DropdownMenu>
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
								<a href="/recetas/{recipe.id}/editar" class="w-full">Editar receta</a>
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
			<Card.Title class="text-lg">{recipe.title}</Card.Title>
			<Card.Description class="py-2">{totals.totalCalories.toFixed(0)} kcal</Card.Description>
		</Card.Header>

		<Card.Content class="flex-grow">
			<div class="flex h-2 w-full overflow-hidden rounded-full bg-muted">
				<div
					class="bg-blue-500"
					style="width: {proteinPercentage}%"
					title="Proteínas: {totals.totalProtein.toFixed(1)}g"
				></div>
				<div
					class="bg-green-500"
					style="width: {carbsPercentage}%"
					title="Carbohidratos: {totals.totalCarbs.toFixed(1)}g"
				></div>
				<div
					class="bg-red-500"
					style="width: {fatPercentage}%"
					title="Grasas: {totals.totalFat.toFixed(1)}g"
				></div>
			</div>
			<div class="mt-2 flex justify-between text-xs text-muted-foreground">
				<span class="flex items-center">
					<span class="mr-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
					P ({totals.totalProtein.toFixed(1)})
				</span>
				<span class="flex items-center">
					<span class="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
					C ({totals.totalCarbs.toFixed(1)})
				</span>
				<span class="flex items-center">
					<span class="mr-1.5 h-2 w-2 rounded-full bg-red-500"></span>
					G ({totals.totalFat.toFixed(1)})
				</span>
			</div>
		</Card.Content>
	</a>
</Card.Root>
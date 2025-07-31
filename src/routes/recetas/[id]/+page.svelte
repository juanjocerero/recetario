<!-- Ruta: src/routes/recetas/[id]/+page.svelte -->
<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { calculateNutritionalInfo } from '$lib/recipeCalculator';
	import type { PageData } from './$types';

	export let data: PageData;
	const { recipe } = data;

	// Justificación: Calculamos la información nutricional a partir de los datos cargados.
	// La lógica de cálculo está aislada en `recipeCalculator`, haciendo este componente
	// puramente presentacional.
	const nutritionalInfo = calculateNutritionalInfo(
		recipe.ingredients.map((ing) => ({
			quantity: ing.quantity,
			calories:
				ing.productCache?.calories || ing.customIngredient?.calories || 0,
			protein:
				ing.productCache?.protein || ing.customIngredient?.protein || 0,
			fat: ing.productCache?.fat || ing.customIngredient?.fat || 0,
			carbs: ing.productCache?.carbs || ing.customIngredient?.carbs || 0
		}))
	);
</script>

<div class="max-w-4xl mx-auto my-8 space-y-8">
	<!-- Encabezado de la Receta -->
	<header class="space-y-2">
		<h1 class="text-4xl font-bold tracking-tight">{recipe.title}</h1>
		{#if recipe.description}
			<p class="text-lg text-gray-600">{recipe.description}</p>
		{/if}
	</header>

	<!-- Información Nutricional -->
	<Card>
		<CardHeader>
			<CardTitle>Información Nutricional</CardTitle>
			<CardDescription>Valores totales para la receta completa.</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
				<div>
					<p class="font-bold text-2xl">{nutritionalInfo.totalCalories.toFixed(2)}</p>
					<p class="text-sm text-gray-600">Calorías (kcal)</p>
				</div>
				<div>
					<p class="font-bold text-2xl">{nutritionalInfo.totalProtein.toFixed(2)} g</p>
					<p class="text-sm text-gray-600">Proteínas</p>
				</div>
				<div>
					<p class="font-bold text-2xl">{nutritionalInfo.totalFat.toFixed(2)} g</p>
					<p class="text-sm text-gray-600">Grasas</p>
				</div>
				<div>
					<p class="font-bold text-2xl">{nutritionalInfo.totalCarbs.toFixed(2)} g</p>
					<p class="text-sm text-gray-600">Carbohidratos</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Ingredientes -->
	<Card>
		<CardHeader>
			<CardTitle>Ingredientes</CardTitle>
		</CardHeader>
		<CardContent>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Nombre</TableHead>
						<TableHead class="w-[150px] text-right">Cantidad</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each recipe.ingredients as ingredient}
						<TableRow>
							<TableCell>
								{ingredient.productCache?.productName || ingredient.customIngredient?.name}
							</TableCell>
							<TableCell class="text-right">{ingredient.quantity} g</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</CardContent>
	</Card>

	<!-- Pasos -->
	<Card>
		<CardHeader>
			<CardTitle>Preparación</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="prose max-w-none whitespace-pre-wrap">
				{recipe.steps}
			</div>
		</CardContent>
	</Card>
</div>

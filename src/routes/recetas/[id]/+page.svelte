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

	const { data } = $props<PageData>();
	const { recipe } = data;

	// Justificación: Creamos una lista de ingredientes plana y consistente a partir
	// de los datos anidados del loader. Esto simplifica el resto del componente.
	const ingredientsList = $derived(
		recipe.ingredients
			.map((ing) => {
				const details = ing.product ?? ing.customIngredient;
				if (!details) return null;

				return {
					name: details.name,
					quantity: ing.quantity,
					calories: details.calories ?? 0,
					protein: details.protein ?? 0,
					fat: details.fat ?? 0,
					carbs: details.carbs ?? 0
				};
			})
			.filter((i): i is NonNullable<typeof i> => i !== null)
	);

	// La lógica de cálculo ahora recibe la lista limpia.
	const nutritionalInfo = $derived(calculateNutritionalInfo(ingredientsList));
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
					{#each ingredientsList as ingredient}
						<TableRow>
							<TableCell>{ingredient.name}</TableCell>
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

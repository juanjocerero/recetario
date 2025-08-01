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
	import { Button } from '$lib/components/ui/button';

	const { data } = $props<PageData>();
	const { recipe } = data;

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

	const nutritionalInfo = $derived(calculateNutritionalInfo(ingredientsList));
</script>

<div class="max-w-4xl mx-auto my-8 space-y-8">
	<header class="space-y-4">
		<div class="flex justify-between items-start">
			<div class="flex-1">
				<h1 class="text-4xl font-bold tracking-tight">{recipe.title}</h1>
				{#if recipe.description}
					<p class="text-lg text-gray-600 mt-2">{recipe.description}</p>
				{/if}
			</div>
			<a href="/recetas/{recipe.id}/editar">
				<Button variant="outline">Editar</Button>
			</a>
		</div>

		<!-- Justificación (Paso 3.4): Se muestra la imagen de la receta si existe. -->
		{#if recipe.imageUrl}
			<div class="w-full aspect-video rounded-lg overflow-hidden">
				<img
					src={recipe.imageUrl}
					alt="Foto de {recipe.title}"
					class="w-full h-full object-cover"
				/>
			</div>
		{/if}
	</header>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
		<div class="md:col-span-2 space-y-8">
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

			<!-- Justificación (Paso 3.4): Se muestra la lista de URLs de referencia si existen. -->
			{#if recipe.urls && recipe.urls.length > 0}
				<Card>
					<CardHeader>
						<CardTitle>Referencias</CardTitle>
					</CardHeader>
					<CardContent>
						<ul class="list-disc pl-5 space-y-2">
							{#each recipe.urls as ref}
								<li>
									<a
										href={ref.url}
										target="_blank"
										rel="noopener noreferrer"
										class="text-blue-600 hover:underline"
									>
										{ref.url}
									</a>
								</li>
							{/each}
						</ul>
					</CardContent>
				</Card>
			{/if}
		</div>

		<div class="space-y-8">
			<!-- Información Nutricional -->
			<Card>
				<CardHeader>
					<CardTitle>Información Nutricional</CardTitle>
					<CardDescription>Valores totales para la receta.</CardDescription>
				</CardHeader>
				<CardContent class="grid grid-cols-2 gap-4">
					<div>
						<p class="font-bold text-lg">{nutritionalInfo.totalCalories.toFixed(0)}</p>
						<p class="text-sm text-gray-600">Calorías (kcal)</p>
					</div>
					<div>
						<p class="font-bold text-lg">{nutritionalInfo.totalProtein.toFixed(1)} g</p>
						<p class="text-sm text-gray-600">Proteínas</p>
					</div>
					<div>
						<p class="font-bold text-lg">{nutritionalInfo.totalFat.toFixed(1)} g</p>
						<p class="text-sm text-gray-600">Grasas</p>
					</div>
					<div>
						<p class="font-bold text-lg">{nutritionalInfo.totalCarbs.toFixed(1)} g</p>
						<p class="text-sm text-gray-600">Carbohidratos</p>
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
								<TableHead class="text-right">Cantidad</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each ingredientsList as ingredient}
								<TableRow>
									<TableCell class="font-medium">{ingredient.name}</TableCell>
									<TableCell class="text-right">{ingredient.quantity} g</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
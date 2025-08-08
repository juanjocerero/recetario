<!--
// Ruta: src/routes/recetas/[slug]/+page.svelte
// Implementación del nuevo diseño de la página de detalles de la receta (v2).
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { calculateNutritionalInfo, type CalculableIngredient } from '$lib/recipeCalculator';
	import { ArrowLeft } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { fly } from 'svelte/transition';

	let { data }: { data: PageData } = $props();
	const { recipe } = data;

	// --- LÓGICA DE CÁLCULO ---
	const calculableIngredients = $derived(
		recipe.ingredients.map((ing) => {
			const source = ing.product;
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

	// Los pasos ya vienen procesados como HTML desde el servidor.
	const { steps } = recipe;
</script>

<div class="container mx-auto p-4 md:py-8 md:px-24">
	<h1 class="font-heading font-light text-3xl md:text-4xl mb-8">{recipe.title}</h1>

	<!-- Sección Superior: Nutrición y Productos -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
		<Card.Root>
			<Card.Header>
				<Card.Title class="font-heading mt-4">Información Nutricional</Card.Title>
				<Card.Description>Valores totales para la receta</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="text-center">
					<span class="text-4xl font-bold">{totals.totalCalories.toFixed(0)}</span>
					<span class="text-muted-foreground">kcal</span>
				</div>
				<div>
					<div class="flex h-2 w-full overflow-hidden rounded-full bg-muted mb-2">
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
					<div class="flex justify-between text-sm text-muted-foreground">
						<span class="flex items-center">
							<span class="mr-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
							Proteínas: {totals.totalProtein.toFixed(1)}g
						</span>
						<span class="flex items-center">
							<span class="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
							Carbs: {totals.totalCarbs.toFixed(1)}g
						</span>
						<span class="flex items-center">
							<span class="mr-1.5 h-2 w-2 rounded-full bg-red-500"></span>
							Grasas: {totals.totalFat.toFixed(1)}g
						</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title class="font-heading mt-4">Ingredientes</Card.Title>
			</Card.Header>
			<Card.Content>
				<ul class="space-y-2 text-muted-foreground">
					{#each recipe.ingredients as ing}
						{@const name = ing.product?.name}
						<li class="flex justify-between">
							<span>{name}</span>
							<span class="font-medium">{ing.quantity.toLocaleString('es-ES')} g</span>
						</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Sección Inferior: Preparación e Imagen -->
	<div class="grid grid-cols-1 lg:grid-cols-3 lg:gap-x-12 gap-y-8">
		<main class="lg:col-span-2">
			<Card.Root>
				<Card.Header>
					<Card.Title class="font-heading text-xl mt-4">Preparación</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-6">
						{#each steps as step, i}
							<div class="flex items-start gap-4">
								<span class="text-2xl md:text-3xl font-bold text-primary mt-[-2px]">{i + 1}.</span>
								<div class="prose prose-sm sm:prose-base max-w-none flex-1">
									{@html step}
								</div>
							</div>
							{#if i < steps.length - 1}
								<Separator />
							{/if}
						{/each}
						{#if steps.length === 0}
							<p class="text-muted-foreground">No hay pasos de preparación definidos.</p>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>
		</main>

		<aside class="lg:col-start-3">
			{#if recipe.imageUrl}
				<img
					src={recipe.imageUrl}
					alt="Imagen de {recipe.title}"
					class="w-full rounded-lg object-cover shadow-lg sticky top-8"
				/>
			{/if}
		</aside>
	</div>

	<!-- Sección de Referencias -->
	{#if recipe.urls.length > 0}
		<div class="mt-8">
			<Card.Root>
				<Card.Header>
					<Card.Title class="mt-4">Referencias</Card.Title>
				</Card.Header>
				<Card.Content>
					<ul class="list-disc pl-5 space-y-2">
						{#each recipe.urls as ref}
							<li>
								<a
									href={ref.url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-blue-600 hover:underline break-all"
								>
									{ref.url}
								</a>
							</li>
						{/each}
					</ul>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}

	<!-- Botones de Acción -->
	<div class="mt-12 flex items-center gap-4">
		<Button variant="outline" href="/">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Volver a todas las recetas
		</Button>

		{#if data.user?.isAdmin}
			<Button href="/recetas/{recipe.slug}/editar">Editar Receta</Button>
		{/if}
	</div>
</div>

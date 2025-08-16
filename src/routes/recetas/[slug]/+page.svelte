<!--
Ruta: src/routes/recetas/[slug]/+page.svelte
Implementación del nuevo diseño de la página de detalles de la receta (v2).
-->
<script lang="ts">
	import { base } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { calculateNutritionalInfo, type CalculableProduct } from '$lib/recipeCalculator';
	import { ArrowLeft } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { recipe } = data;

	// --- LÓGICA DE CÁLCULO ---
	const calculableProducts = $derived(
		recipe.ingredients.map((ing) => {
			const source = ing.product;
			return {
				quantity: ing.quantity,
				calories: source?.calories,
				protein: source?.protein,
				fat: source?.fat,
				carbs: source?.carbs
			} as CalculableProduct;
		})
	);

	const totals = $derived(calculateNutritionalInfo(calculableProducts));
	const totalGrams = $derived(totals.totalProtein + totals.totalCarbs + totals.totalFat);

	const proteinPercentage = $derived(totalGrams > 0 ? (totals.totalProtein / totalGrams) * 100 : 0);
	const carbsPercentage = $derived(totalGrams > 0 ? (totals.totalCarbs / totalGrams) * 100 : 0);
	const fatPercentage = $derived(totalGrams > 0 ? (totals.totalFat / totalGrams) * 100 : 0);

	// Los pasos ya vienen procesados como HTML desde el servidor.
	const { steps } = recipe;

	// Para las metaetiquetas, necesitamos una URL absoluta.
	const absoluteImageUrl = $derived(
		recipe.imageUrl ? new URL(recipe.imageUrl, data.urlHref).href : null
	);
</script>

<svelte:head>
	<title>{recipe.title}</title>
	<meta name="description" content="Información nutricional, ingredientes y pasos para preparar {recipe.title}" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="article" />
	<meta property="og:title" content={recipe.title} />
	<meta property="og:description" content="Información nutricional, ingredientes y pasos para preparar {recipe.title}" />
	{#if absoluteImageUrl}
		<meta property="og:image" content={absoluteImageUrl} />
	{/if}
	<meta property="og:url" content={data.urlHref} />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={recipe.title} />
	<meta name="twitter:description" content="Información nutricional, ingredientes y pasos para preparar {recipe.title}" />
	{#if absoluteImageUrl}
		<meta name="twitter:image" content={absoluteImageUrl} />
	{/if}
</svelte:head>

<div class="container mx-auto p-4 md:px-24 mt-16 md:mt-0">
	<h1 class="font-heading font-light text-3xl md:text-4xl mb-8">{recipe.title}</h1>

	<div class="grid grid-cols-1 lg:grid-cols-5 lg:gap-x-12 gap-y-8">
		<!-- Contenedor para reordenamiento en móvil -->
		<div class="contents lg:grid lg:col-span-5 lg:grid-cols-5 lg:gap-x-12">
			<!-- Columna Principal: Preparación -->
			<main class="lg:col-span-3 order-1 lg:order-1">
				<Card.Root>
					<Card.Header>
						<Card.Title class="font-heading text-xl mt-4">Preparación</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="space-y-6">
							{#each steps as step, i}
								<div class="flex items-start gap-4">
									<span class="text-2xl md:text-3xl font-bold text-primary mt-[-2px]"
										>{i + 1}.</span
									>
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

			<!-- Barra Lateral (Contenedor de varios elementos en móvil) -->
			<aside class="lg:col-span-2 lg:col-start-4 order-2 lg:order-2">
				<div class="sticky top-8 flex flex-col gap-8">
					<!-- Imagen -->
					{#if recipe.imageUrl}
						<div class="order-4 lg:order-1">
							<img
								src="{`${base}${recipe.imageUrl}`}"
								alt="Imagen de {recipe.title}"
								class="w-full rounded-lg object-cover shadow-lg"
							/>
						</div>
					{/if}

					<!-- Información Nutricional -->
					<div class="order-1 lg:order-2">
						<Card.Root>
							<Card.Header>
								<Card.Title class="font-heading mt-4">Información Nutricional</Card.Title>
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
					</div>

					<!-- Ingredientes -->
					<div class="order-2 lg:order-3">
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
				</div>
			</aside>

			<!-- Sección de Referencias -->
			{#if recipe.urls.length > 0}
				<div class="mt-8 lg:mt-0 lg:col-span-3 order-5 lg:order-3">
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
											class="text-primary hover:underline break-all"
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
			<div class="mt-12 lg:col-span-3 flex items-center gap-4 order-6 lg:order-4">
				<Button variant="outline" href="/">
					<ArrowLeft class="mr-2 h-4 w-4" />
					Volver a todas las recetas
				</Button>

				{#if data.user?.role === 'admin'}
					<Button href="/recetas/{recipe.slug}/editar">Editar Receta</Button>
				{/if}
			</div>
		</div>
	</div>
</div>

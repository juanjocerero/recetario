<!-- Ruta: src/routes/recetas/[id]/editar/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { calculateNutritionalInfo } from '$lib/recipeCalculator';
	import type { RecipeIngredient } from '$lib/schemas/recipeSchema';
	import { debounce } from '$lib/utils';
	import type { PageData } from './$types';

	export let data: PageData;
	const { recipe } = data;

	// --- Estado del Formulario (inicializado con datos de `load`) ---
	let title = recipe.title;
	let description = recipe.description || '';
	let steps = recipe.steps;
	let ingredients: (RecipeIngredient & { name: string })[] = recipe.ingredients.map((ing) => ({
		id: ing.productCache?.id || ing.customIngredient?.id || '',
		name: ing.productCache?.productName || ing.customIngredient?.name || 'Ingrediente desconocido',
		type: ing.productCache ? 'product' : 'custom',
		quantity: ing.quantity
	}));

	// --- Lógica de Búsqueda (idéntica a la de creación) ---
	let searchTerm = '';
	let searchResults: { id: string; name: string; type: 'custom' | 'product' }[] = [];
	let isSearching = false;
	let showResults = false;

	const handleSearch = debounce(async () => {
		if (searchTerm.length < 3) {
			searchResults = [];
			showResults = false;
			return;
		}
		isSearching = true;
		try {
			const response = await fetch(`/api/ingredients/search?q=${searchTerm}`);
			if (response.ok) {
				searchResults = await response.json();
				showResults = true;
			}
		} catch (error) {
			console.error('Error searching ingredients:', error);
		} finally {
			isSearching = false;
		}
	}, 300);

	function addIngredient(result: { id: string; name: string; type: 'custom' | 'product' }) {
		if (ingredients.some((ing) => ing.id === result.id && ing.type === result.type)) return;
		ingredients = [...ingredients, { ...result, quantity: 100 }];
		searchTerm = '';
		searchResults = [];
		showResults = false;
	}

	function removeIngredient(index: number) {
		ingredients = ingredients.filter((_, i) => i !== index);
	}

	// --- Cálculo Nutricional (idéntico) ---
	$: nutritionalInfo = calculateNutritionalInfo(
		ingredients.map((ing) => ({
			quantity: ing.quantity,
			calories: 0,
			protein: 0,
			fat: 0,
			carbs: 0
		}))
	);

	// --- Envío del Formulario (modificado para actualizar) ---
	let isSubmitting = false;
	let errors: Record<string, any> = {};

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		isSubmitting = true;
		errors = {};

		const payload = {
			title,
			description,
			steps,
			ingredients: ingredients.map(({ id, quantity, type }) => ({ id, quantity, type }))
		};

		try {
			const response = await fetch(`/api/recipes/${recipe.id}`, {
				method: 'PUT', // Justificación: Usamos PUT para actualizar un recurso existente.
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (response.ok) {
				const updatedRecipe = await response.json();
				await goto(`/recetas/${updatedRecipe.id}`);
			} else {
				const errorData = await response.json();
				if (response.status === 400) {
					errors = errorData.errors;
				} else {
					errors.general = errorData.message || 'Ocurrió un error en el servidor.';
				}
			}
		} catch (err) {
			errors.general = 'No se pudo conectar con el servidor.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card class="max-w-4xl mx-auto my-8">
	<CardHeader>
		<CardTitle>Editar Receta</CardTitle>
	</CardHeader>
	<CardContent>
		<form on:submit={handleSubmit} class="space-y-6">
			<!-- El resto del formulario es visualmente idéntico al de creación -->
			<div class="space-y-2">
				<Label for="title">Título</Label>
				<Input id="title" bind:value={title} required />
				{#if errors.title}
					<p class="text-sm text-red-500">{errors.title._errors[0]}</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label for="description">Descripción (Opcional)</Label>
				<Textarea id="description" bind:value={description} />
			</div>
			<div class="space-y-2">
				<Label for="steps">Pasos</Label>
				<Textarea id="steps" bind:value={steps} rows={8} required />
				{#if errors.steps}
					<p class="text-sm text-red-500">{errors.steps._errors[0]}</p>
				{/if}
			</div>

			<div class="space-y-2 relative">
				<Label for="ingredient-search">Añadir Ingrediente</Label>
				<Input
					id="ingredient-search"
					bind:value={searchTerm}
					oninput={handleSearch}
					onfocus={() => (showResults = true)}
					placeholder="Buscar por nombre (ej. Pollo, Harina...)"
				/>
				{#if isSearching}
					<p class="text-sm text-gray-500">Buscando...</p>
				{/if}
				{#if showResults && searchResults.length > 0}
					<div class="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
						<ul>
							{#each searchResults as result (result.id + result.type)}
								<li>
									<button
										type="button"
										class="w-full text-left px-4 py-2 cursor-pointer hover:bg-gray-100"
										on:click={() => addIngredient(result)}
										on:mousedown={(e) => e.preventDefault()}
									>
										{result.name}
										<span class="text-xs text-gray-500">({result.type})</span>
									</button>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-medium">Ingredientes de la Receta</h3>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nombre</TableHead>
							<TableHead class="w-[150px]">Cantidad (g)</TableHead>
							<TableHead class="w-[100px] text-right">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each ingredients as ingredient, i}
							<TableRow>
								<TableCell>{ingredient.name}</TableCell>
								<TableCell>
									<Input
										type="number"
										bind:value={ingredient.quantity}
										min="1"
										class="w-full"
									/>
								</TableCell>
								<TableCell class="text-right">
									<Button
										type="button"
										variant="destructive"
										size="sm"
										onclick={() => removeIngredient(i)}
									>
										Quitar
									</Button>
								</TableCell>
							</TableRow>
						{/each}
						{#if ingredients.length === 0}
							<TableRow>
								<TableCell colspan={3} class="text-center text-gray-500">
									Añade ingredientes usando el buscador.
								</TableCell>
							</TableRow>
						{/if}
					</TableBody>
				</Table>
			</div>

			<div class="space-y-2 p-4 border rounded-lg bg-gray-50">
				<h3 class="text-lg font-medium">Información Nutricional (Total)</h3>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<p class="font-bold text-xl">{nutritionalInfo.totalCalories.toFixed(2)}</p>
						<p class="text-sm text-gray-600">Calorías (kcal)</p>
					</div>
					<div>
						<p class="font-bold text-xl">{nutritionalInfo.totalProtein.toFixed(2)} g</p>
						<p class="text-sm text-gray-600">Proteínas</p>
					</div>
					<div>
						<p class="font-bold text-xl">{nutritionalInfo.totalFat.toFixed(2)} g</p>
						<p class="text-sm text-gray-600">Grasas</p>
					</div>
					<div>
						<p class="font-bold text-xl">{nutritionalInfo.totalCarbs.toFixed(2)} g</p>
						<p class="text-sm text-gray-600">Carbohidratos</p>
					</div>
				</div>
				<p class="text-xs text-gray-500 mt-2">
					*El cálculo nutricional es una aproximación.
				</p>
			</div>

			<div class="flex justify-end">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Actualizando...' : 'Actualizar Receta'}
				</Button>
			</div>
			{#if errors.general}
				<p class="text-sm text-red-500 text-right">{errors.general}</p>
			{/if}
		</form>
	</CardContent>
</Card>

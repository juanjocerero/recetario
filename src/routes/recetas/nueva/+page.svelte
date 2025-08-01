<!-- Ruta: src/routes/recetas/nueva/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import { calculateNutritionalInfo, type CalculableIngredient } from '$lib/recipeCalculator';
	import type { RecipeIngredient } from '$lib/schemas/recipeSchema';

	type IngredientWithDetails = RecipeIngredient & CalculableIngredient & { name: string };

	let title = $state('');
	let description = $state('');
	let steps = $state('');
	let ingredients = $state<IngredientWithDetails[]>([]);

	let searchTerm = $state('');
	let searchResults = $state<{ id: string; name: string; type: 'custom' | 'product' }[]>([]);
	let isSearching = $state(false);
	let showResults = $state(false);

	// Justificación: Se reemplaza `debounce` por `AbortController`.
	// Esto crea un patrón de búsqueda más robusto y testeable. Cada nueva búsqueda
	// cancela la anterior, evitando condiciones de carrera y haciendo que la llamada
	// a la API sea determinista en los tests.
	let searchController: AbortController | null = null;

	async function handleSearch(event: Event) {
		if (searchController) {
			searchController.abort();
		}
		searchController = new AbortController();
		const signal = searchController.signal;

		const currentSearchTerm = (event.currentTarget as HTMLInputElement).value;

		if (currentSearchTerm.length < 3) {
			searchResults = [];
			showResults = false;
			return;
		}

		isSearching = true;
		try {
			const response = await fetch(`/api/ingredients/search?q=${currentSearchTerm}`, { signal });
			if (response.ok) {
				searchResults = await response.json();
				showResults = true;
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return;
			}
			console.error('Error searching ingredients:', error);
		} finally {
			isSearching = false;
		}
	}

	async function addIngredient(result: { id: string; name: string; type: 'custom' | 'product' }) {
		if (ingredients.some((ing) => ing.id === result.id && ing.type === result.type)) return;

		try {
			const response = await fetch(`/api/ingredients/details/${result.id}?type=${result.type}`);
			if (!response.ok) throw new Error('Failed to fetch ingredient details');
			const details: CalculableIngredient = await response.json();

			ingredients.push({
				...result,
				quantity: 100,
				calories: details.calories,
				protein: details.protein,
				fat: details.fat,
				carbs: details.carbs
			});
		} catch (error) {
			console.error('Error adding ingredient:', error);
		} finally {
			searchTerm = '';
			searchResults = [];
			showResults = false;
		}
	}

	function removeIngredient(index: number) {
		ingredients.splice(index, 1);
	}

	let nutritionalInfo = $derived(calculateNutritionalInfo(ingredients));

	let isSubmitting = $state(false);
	let errors = $state<Record<string, any>>({});

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
			const response = await fetch('/api/recipes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (response.ok) {
				const newRecipe = await response.json();
				await goto(`/recetas/${newRecipe.id}`);
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
		<CardTitle>Crear Nueva Receta</CardTitle>
	</CardHeader>
	<CardContent>
		<form onsubmit={handleSubmit} class="space-y-6">
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
										onclick={() => addIngredient(result)}
										onmousedown={(e) => e.preventDefault()}
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
			</div>

			<div class="flex justify-end">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Guardando...' : 'Guardar Receta'}
				</Button>
			</div>
			{#if errors.general}
				<p class="text-sm text-red-500 text-right">{errors.general}</p>
			{/if}
		</form>
	</CardContent>
</Card>

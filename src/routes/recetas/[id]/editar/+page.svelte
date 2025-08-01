<!-- Ruta: src/routes/recetas/[id]/editar/+page.svelte -->
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
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { ChevronsUpDown } from 'lucide-svelte';
	import type { PageData } from './$types';
	
	const { data }: { data: PageData } = $props();
	
	type IngredientWithDetails = RecipeIngredient & CalculableIngredient & { name: string };
	type SearchResult = {
		id: string;
		name: string;
		type: 'custom' | 'product';
		imageUrl: string | null;
	};
	
	// Inicializar estado con los datos de la receta
	let title = $state(data.recipe.title);
	let description = $state(data.recipe.description ?? '');
	let steps = $state(data.recipe.steps);
	const initialIngredients = data.recipe.ingredients
		.map((ing): IngredientWithDetails | null => {
			const quantity = ing.quantity;
			if (ing.customIngredient) {
				return {
					id: ing.customIngredient.id,
					type: 'custom',
					quantity,
					name: ing.customIngredient.name,
					calories: ing.customIngredient.calories ?? 0,
					protein: ing.customIngredient.protein ?? 0,
					fat: ing.customIngredient.fat ?? 0,
					carbs: ing.customIngredient.carbs ?? 0
				};
			}
			if (ing.product) {
				return {
					id: ing.product.id,
					type: 'product',
					quantity,
					name: ing.product.name,
					calories: ing.product.calories ?? 0,
					protein: ing.product.protein ?? 0,
					fat: ing.product.fat ?? 0,
					carbs: ing.product.carbs ?? 0
				};
			}
			return null;
		})
		.filter((ing): ing is IngredientWithDetails => ing !== null);
	let ingredients = $state<IngredientWithDetails[]>(initialIngredients);
	
	let searchResults = $state<SearchResult[]>([]);
	let isSearching = $state(false);
	let open = $state(false);
	let inputValue = $state('');
	
	let eventSource: EventSource | null = null;

	function handleSearch(event: Event) {
		const currentSearchTerm = (event.currentTarget as HTMLInputElement).value;

		if (eventSource) {
			eventSource.close();
		}
		searchResults = [];

		if (currentSearchTerm.length < 2) {
			isSearching = false;
			return;
		}

		isSearching = true;
		eventSource = new EventSource(`/api/ingredients/search?q=${encodeURIComponent(currentSearchTerm)}`);

		eventSource.addEventListener('message', (e) => {
			const newResults = JSON.parse(e.data);
			searchResults = [...searchResults, ...newResults];
		});

		eventSource.addEventListener('stream_error', (e) => {
			const errorData = JSON.parse((e as MessageEvent).data);
			console.error('Error de stream recibido:', errorData);
		});

		eventSource.onerror = (err) => {
			console.error('Error en la conexión de EventSource:', err);
			isSearching = false;
			eventSource?.close();
		};

		eventSource.addEventListener('close', () => {
			isSearching = false;
			eventSource?.close();
		});
	}
	
	async function addIngredient(result: SearchResult) {
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
			open = false;
			searchResults = [];
			inputValue = '';
			if (eventSource) {
				eventSource.close();
				isSearching = false;
			}
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
			const response = await fetch(`/api/recipes/${data.recipe.id}`, {
				method: 'PUT',
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
			
			<div class="space-y-2">
				<Label>Añadir Ingrediente</Label>
				<Popover.Root bind:open>
					<Popover.Trigger class="w-full">
						<Button variant="outline" role="combobox" aria-expanded={open} class="w-full justify-between">
							{inputValue || 'Seleccionar ingrediente...'}
							<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-[--trigger-width] p-0">
						<Command.Root>
							<Command.Input oninput={handleSearch} placeholder="Buscar ingrediente..." />
							<Command.List>
								{#if isSearching}
								<Command.Item>Buscando...</Command.Item>
								{:else if searchResults.length === 0}
								<Command.Empty>Ningún ingrediente encontrado.</Command.Empty>
								{/if}
								<Command.Group>
									{#each searchResults as result (result.id + result.type)}
									<Command.Item
									value={result.name}
									onSelect={() => {
										inputValue = result.name;
										addIngredient(result);
									}}
									class="flex items-center gap-2"
									>
									<img
									src={result.imageUrl || 'https://placehold.co/40x40?text=N/A'}
									alt={result.name}
									class="h-8 w-8 rounded-sm object-cover"
									/>
									<span>{result.name}</span>
								</Command.Item>
								{/each}
							</Command.Group>
						</Command.List>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
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
							<Input type="number" bind:value={ingredient.quantity} min="1" class="w-full" />
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
			{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
		</Button>
	</div>
	{#if errors.general}
	<p class="text-sm text-red-500 text-right">{errors.general}</p>
	{/if}
</form>
</CardContent>
</Card>
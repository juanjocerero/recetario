<!-- Ruta: src/routes/recetas/nueva/+page.svelte -->
<script lang="ts">
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
	import { ChevronsUpDown, Trash2 } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import UrlImageFetcher from '$lib/components/recipes/UrlImageFetcher.svelte';

	let { form }: { form: ActionData } = $props();

	type IngredientWithDetails = RecipeIngredient & CalculableIngredient & { name: string };
	type SearchResult = {
		id: string;
		name: string;
		source: 'local' | 'off';
		type: 'custom' | 'product';
		imageUrl: string | null;
	};

	// --- Estado del formulario ---
	let title = $state('');
	let steps = $state(['']);
	let imageUrl = $state('');
	let urls = $state<string[]>([]);
	let ingredients = $state<IngredientWithDetails[]>([]);

	// --- Estado del buscador de ingredientes ---
	let searchResults = $state<SearchResult[]>([]);
	let isSearching = $state(false);
	let open = $state(false);
	let inputValue = $state('');
	let searchTerm = $state('');

	$effect(() => {
		let eventSource: EventSource | null = null;

		if (searchTerm.length < 3) {
			searchResults = [];
			isSearching = false;
		} else {
			isSearching = true;
			searchResults = [];
			eventSource = new EventSource(`/api/ingredients/search?q=${encodeURIComponent(searchTerm)}`);

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

		return () => {
			eventSource?.close();
		};
	});

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
			searchTerm = '';
			inputValue = '';
		}
	}

	function removeIngredient(index: number) {
		ingredients.splice(index, 1);
	}

	// --- Gestión de subida de imagen ---
	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				imageUrl = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	// --- Cálculos y envío ---
	let nutritionalInfo = $derived(calculateNutritionalInfo(ingredients));
	let isSubmitting = $state(false);
</script>

<Card class="max-w-4xl mx-auto my-8">
	<CardHeader>
		<CardTitle>Crear Nueva Receta</CardTitle>
	</CardHeader>
	<CardContent>
		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ result }) => {
					// La redirección se maneja automáticamente por el servidor en caso de éxito.
					// Solo necesitamos gestionar el estado de `isSubmitting`.
					if (result.type === 'failure' || result.type === 'error') {
						isSubmitting = false;
					}
				};
			}}
			class="space-y-6"
		>
			<!-- Campos ocultos para enviar datos complejos -->
			<input type="hidden" name="ingredients" value={JSON.stringify(ingredients.map(({ id, quantity, type }) => ({ id, quantity, type })))} />
			<input type="hidden" name="urls" value={JSON.stringify(urls.filter(u => u.trim() !== ''))} />
			<input type="hidden" name="steps" value={JSON.stringify(steps.filter(s => s.trim() !== ''))} />
			<input type="hidden" name="imageUrl" value={imageUrl} />

			<!-- Campos del formulario -->
			<div class="space-y-2">
				<Label for="title">Título</Label>
				<Input id="title" name="title" bind:value={title} required />
				{#if form?.errors?.title}
					<p class="text-sm text-red-500">{form.errors.title}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="image">Imagen de la Receta</Label>
				<div class="flex items-center gap-4">
					{#if imageUrl}
						<img
							src={imageUrl}
							alt="Previsualización de la receta"
							class="h-24 w-24 rounded-md object-cover"
						/>
					{/if}
					<Input id="image" type="file" onchange={handleImageUpload} accept="image/*" />
				</div>
				<p class="text-sm text-gray-500">
					Sube una imagen o deja el campo vacío para intentar usar la de la primera URL de referencia.
				</p>
			</div>

			<div class="space-y-2">
				<Label>URLs de Referencia</Label>
				<UrlImageFetcher bind:urls bind:imageUrl />
				{#if form?.errors?.urls}
					<p class="text-sm text-red-500">{form.errors.urls}</p>
				{/if}
			</div>

			<div class="space-y-4">
				<Label class="text-lg font-medium">Pasos de la Receta</Label>
				{#each steps as step, i}
					<div class="flex items-start gap-2">
						<div class="flex-1 space-y-1">
							<Label for={`step-${i}`} class="text-sm font-normal text-gray-600">Paso {i + 1}</Label>
							<Textarea
								id={`step-${i}`}
								name={`step-${i}`}
								bind:value={steps[i]}
								rows={3}
								placeholder="Describe este paso... (soporta Markdown)"
							/>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onclick={() => steps.splice(i, 1)}
							class="mt-6"
							aria-label="Eliminar paso"
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>
				{/each}
				<Button type="button" variant="outline" onclick={() => steps.push('')}>
					Añadir Paso
				</Button>
				{#if form?.errors?.steps}
					<p class="text-sm text-red-500">{form.errors.steps}</p>
				{/if}
			</div>

			<!-- Buscador y tabla de ingredientes -->
			<div class="space-y-2">
				<Label>Añadir Ingrediente</Label>
				<Popover.Root bind:open>
					<Popover.Trigger
						class="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border w-full justify-between h-9 px-4 py-2"
						role="combobox"
						aria-expanded={open}
					>
						<div class="flex items-center justify-between w-full">
							{inputValue || 'Seleccionar ingrediente...'}
							<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</div>
					</Popover.Trigger>
					<Popover.Content class="w-[--trigger-width] p-0">
						<Command.Root filter={() => 1}>
							<Command.Input bind:value={searchTerm} placeholder="Buscar ingrediente..." />
							<Command.List>
								{#if searchResults.length > 0}
									{#each searchResults as result (result.id + result.type)}
										<Command.Item
											value={result.name}
											onSelect={() => {
												inputValue = result.name;
												addIngredient(result);
											}}
											class={`flex items-center gap-2 ${result.source === 'local' ? 'ring-1 ring-green-500 rounded-sm' : ''}`}
										>
											<img
												src={result.imageUrl || 'https://placehold.co/40x40?text=N/A'}
												alt={result.name}
												class="h-8 w-8 rounded-sm object-cover"
											/>
											<span>{result.name}</span>
										</Command.Item>
									{/each}
								{:else}
									<div class="p-4 text-sm text-center text-gray-500">
										{#if isSearching}
											Buscando...
										{:else if searchTerm.length < 3}
											Escribe al menos 3 caracteres para buscar...
										{:else}
											No se encontraron resultados.
										{/if}
									</div>
								{/if}
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
				{#if form?.errors?.ingredients}
					<p class="text-sm text-red-500">{form.errors.ingredients}</p>
				{/if}
			</div>

			<!-- Información nutricional -->
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
			{#if form?.message}
				<p class="text-sm text-red-500 text-right">{form.message}</p>
			{/if}
		</form>
	</CardContent>
</Card>
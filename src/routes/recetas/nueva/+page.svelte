<!-- Ruta: src/routes/recetas/nueva/+page.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Table, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import { calculateNutritionalInfo, type CalculableIngredient } from '$lib/recipeCalculator';
	import type { RecipeIngredient } from '$lib/schemas/recipeSchema';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { ChevronsUpDown, Trash2, GripVertical } from 'lucide-svelte';
	import { enhance, applyAction } from '$app/forms';
	import type { ActionData } from './$types';
	import UrlImageFetcher from '$lib/components/recipes/UrlImageFetcher.svelte';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';

	let { form }: { form: ActionData } = $props();

	type IngredientWithDetails = RecipeIngredient &
		CalculableIngredient & { name: string; originalId?: string };
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
	let urls: string[] = $state([]);
	let ingredients: IngredientWithDetails[] = $state([]);

	// --- Drag and Drop ---
	/**
	 * Maneja el evento de soltar (drop) de la librería @thisux/sveltednd.
	 * La librería no nos da los índices de origen y destino directamente,
	 * por lo que debemos inferirlos a partir de los datos que sí nos proporciona.
	 * @param state El objeto de estado que nos devuelve la librería.
	 */
	function handleDrop(state: DragDropState<IngredientWithDetails>) {
		// Desestructuramos las dos piezas de información clave que nos da el estado:
		// 1. draggedItem: El objeto de datos completo del elemento que se está arrastrando.
		// 2. targetElement: El elemento del DOM sobre el cual se soltó el 'draggedItem'.
		const { draggedItem, targetElement } = state;

		// Si por alguna razón no tenemos estos datos, abortamos para evitar errores.
		if (!draggedItem || !targetElement) return;

		// --- Paso 1: Encontrar el índice de ORIGEN ---
		// Buscamos en nuestro array de 'ingredients' el índice del objeto que coincide
		// con el 'id' del 'draggedItem'. Esta es nuestra fuente de verdad.
		const sourceIndex = ingredients.findIndex((item) => item.id === draggedItem.id);

		// --- Paso 2: Encontrar el índice de DESTINO ---
		// El 'targetElement' puede ser cualquier elemento dentro de la fila (un <td>, un <span>, etc.).
		// Usamos .closest('tr') para asegurarnos de que obtenemos la fila contenedora (el <tr>).
		const targetRow = (targetElement as HTMLElement).closest('tr');

		// Si no encontramos una fila o la fila no tiene un padre (lo que sería muy raro), abortamos.
		if (!targetRow || !targetRow.parentElement) return;

		// Una vez que tenemos la fila de destino (targetRow), necesitamos saber su índice.
		// Lo hacemos convirtiendo la colección de hijos del <tbody> (targetRow.parentElement.children)
		// en un array y buscando la posición de nuestra 'targetRow' en él.
		const targetIndex = Array.from(targetRow.parentElement.children).indexOf(targetRow);

		// Si por alguna razón no hemos podido encontrar alguno de los índices, abortamos.
		if (sourceIndex === -1 || targetIndex === -1) return;

		// --- Paso 3: Reordenar el array ---
		// Creamos una copia de nuestro array de ingredientes para no mutar el original directamente
		// hasta que la operación esté completa.
		const reorderedIngredients = [...ingredients];

		// Sacamos el elemento arrastrado de su posición original.
		const [removed] = reorderedIngredients.splice(sourceIndex, 1);

		// Insertamos el elemento que sacamos en su nueva posición de destino.
		reorderedIngredients.splice(targetIndex, 0, removed);

		// Finalmente, actualizamos el estado de Svelte con el nuevo array reordenado,
		// lo que provocará que la interfaz se redibuje correctamente.
		ingredients = reorderedIngredients;
	}

	// --- Estado del buscador de ingredientes ---
	let searchResults: SearchResult[] = $state([]);
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

	// En la sección <script>

	async function addIngredient(result: SearchResult) {
		// Comprobamos si el ID combinado ya existe
		const dndId = result.id + result.type;
		if (ingredients.some((ing) => ing.id === dndId)) return;

		try {
			const response = await fetch(`/api/ingredients/details/${result.id}?type=${result.type}`);
			if (!response.ok) throw new Error('Failed to fetch ingredient details');
			const details: CalculableIngredient = await response.json();

			// Creamos el nuevo ingrediente y SOBREESCRIBIMOS su 'id'
			// con el ID único que usará dndzone. Guardamos los originales si es necesario.
			ingredients.push({
				...result,
				...details,
				originalId: result.id, // Opcional: guardar el id original
				id: dndId, // El ID estable y único para dndzone
				quantity: 100
			});
			// ingredients se actualiza, la reactividad funciona como se espera.
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
					await applyAction(result);
					isSubmitting = false;
				};
			}}
			class="space-y-6"
		>
			<!-- Campos ocultos para enviar datos complejos -->
			<input
				type="hidden"
				name="ingredients"
				value={JSON.stringify(
					ingredients.map(({ id, quantity, type }) => ({ id, quantity, type }))
				)}
			/>
			<input type="hidden" name="urls" value={JSON.stringify(urls.filter((u) => u.trim() !== ''))} />
			<input
				type="hidden"
				name="steps"
				value={JSON.stringify(steps.filter((s) => s.trim() !== ''))}
			/>
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
					Sube una imagen o deja el campo vacío para intentar usar la de la primera URL de
					referencia.
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
							<Label for={`step-${i}`} class="text-sm font-normal text-gray-600"
								>Paso {i + 1}</Label
							>
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
							<TableHead class="w-[50px]"></TableHead>
							<TableHead>Nombre</TableHead>
							<TableHead class="w-[150px]">Cantidad (g)</TableHead>
							<TableHead class="w-[100px] text-right">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<tbody
						use:droppable={{
							container: 'ingredients',
							callbacks: { onDrop: handleDrop }
						}}
					>
						{#each ingredients as ingredient, i (ingredient.id)}
							<tr
								use:draggable={{ container: 'ingredients', dragData: ingredient }}
								class="hover:[&,&>svelte-css-wrapper]:[&>th,td]:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
							>
								<TableCell class="cursor-grab">
									<GripVertical class="h-5 w-5 text-gray-400" />
								</TableCell>
								<TableCell>{ingredient.name}</TableCell>
								<TableCell>
									<Input
										type="number"
										value={ingredient.quantity}
										oninput={(e) => (ingredient.quantity = e.currentTarget.valueAsNumber)}
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
							</tr>
						{/each}
						{#if ingredients.length === 0}
							<tr
								class="hover:[&,&>svelte-css-wrapper]:[&>th,td]:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
							>
								<TableCell colspan={4} class="text-center text-gray-500">
									Añade ingredientes usando el buscador.
								</TableCell>
							</tr>
						{/if}
					</tbody>
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
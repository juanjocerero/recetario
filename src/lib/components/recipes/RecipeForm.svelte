<!-- Ruta: src/lib/components/recipes/RecipeForm.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Table, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import { calculateNutritionalInfo, type CalculableProduct } from '$lib/recipeCalculator';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { ChevronsUpDown, Trash2, GripVertical, Database, Save, X } from 'lucide-svelte';
	import { enhance, applyAction } from '$app/forms';
	import UrlImageFetcher from '$lib/components/recipes/UrlImageFetcher.svelte';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import { browser } from '$app/environment';

	import { cn } from '$lib/utils';
	import * as autosave from '$lib/runes/useAutosave.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	// --- Tipos ---
	type IngredientWithDetails = CalculableProduct & {
		id: string; // CUID para local, barcode para OFF
		name: string;
		source: 'local' | 'off';
		imageUrl?: string | null;
	};

	type SearchResult = {
		id: string;
		name: string;
		source: 'local' | 'off';
		imageUrl: string | null;
	};

	type InitialData = {
		title: string;
		steps: string[] | string;
		imageUrl: string | null;
		urls: { url: string }[];
		ingredients: {
			quantity: number;
			product: (Omit<CalculableProduct, 'quantity'> & {
				id: string;
				name: string;
				imageUrl: string | null;
			}) | null;
		}[];
	};

	type FormState = {
		title: string;
		steps: string[];
		imageUrl: string | null;
		urls: string[];
		ingredients: IngredientWithDetails[];
	};

	// --- Props ---
	let {
		initialData = null,
		form = null,
		cardTitle = 'Crear Nueva Receta',
		submitButtonText = 'Guardar Receta',
		onSuccess = async () => {},
		recipeId = null
	}: {
		initialData?: InitialData | null;
		form?: { message?: string; errors?: Record<string, string | undefined> } | null;
		cardTitle?: string;
		submitButtonText?: string;
		onSuccess?: () => Promise<void>;
		recipeId?: string | null;
	} = $props();

	// --- Lógica de inicialización ---
	const getRecipeSteps = (stepsData: unknown): string[] => {
		if (Array.isArray(stepsData)) {
			return stepsData.map(String);
		}
		if (browser && typeof stepsData === 'string') {
			try {
				const parsed = JSON.parse(stepsData);
				return Array.isArray(parsed) ? parsed.map(String) : [String(stepsData)];
			} catch (e) {
				return [String(stepsData)];
			}
		}
		return [''];
	};

	const mapInitialIngredients = (ingredientsData: InitialData['ingredients'] | undefined) => {
		if (!ingredientsData) return [];
		return ingredientsData
			.map((ing): IngredientWithDetails | null => {
				const product = ing.product;
				if (!product) return null;

				return {
					...product,
					id: product.id, // El ID ya es el CUID del producto
					quantity: ing.quantity,
					source: 'local' // Todos los productos guardados son locales
				};
			})
			.filter((ing): ing is IngredientWithDetails => ing !== null);
	};

	// --- Estado del formulario (unificado) ---
	let formData: FormState = $state({
		title: '',
		steps: [''],
		imageUrl: null,
		urls: [],
		ingredients: []
	});

	$effect(() => {
		if (initialData && status === 'editing') {
			const isPristine =
				formData.title === '' &&
				formData.steps.length <= 1 &&
				formData.steps[0] === '' &&
				formData.ingredients.length === 0 &&
				formData.urls.length === 0;

			if (isPristine) {
				formData.title = initialData.title ?? '';
				formData.steps = getRecipeSteps(initialData.steps);
				formData.imageUrl = initialData.imageUrl ?? null;
				formData.urls = initialData.urls?.map((u) => u.url) ?? [];
				formData.ingredients = mapInitialIngredients(initialData.ingredients);
			}
		}
	});

	// --- Autoguardado (Lógica de control en el componente) ---
	const AUTOSAVE_KEY = 'recipe-autosave-draft';
	type AutosaveDraft = { recipeId: string | null; formData: FormState };
	type Status = 'initializing' | 'awaitingDecision' | 'editing';
	let status = $state<Status>('initializing');

	const isFormDirty = $derived(
		(initialData?.title ?? '') !== formData.title ||
			JSON.stringify(getRecipeSteps(initialData?.steps)) !== JSON.stringify(formData.steps) ||
			JSON.stringify(initialData?.urls.map((u) => u.url) ?? []) !==
				JSON.stringify(formData.urls) ||
			JSON.stringify(mapInitialIngredients(initialData?.ingredients)) !==
				JSON.stringify(formData.ingredients)
	);

	function areStatesIdentical(stateA: FormState, stateB: FormState): boolean {
		return JSON.stringify(stateA) === JSON.stringify(stateB);
	}

	onMount(() => {
		// 1. Migración transparente de borradores antiguos
		const legacyKey = recipeId ? `recipe-autosave-${recipeId}` : 'new-recipe-autosave';
		if (autosave.hasData(legacyKey)) {
			const legacyData = autosave.load<FormState>(legacyKey);
			if (legacyData) {
				autosave.save(AUTOSAVE_KEY, { recipeId, formData: legacyData });
			}
			autosave.clear(legacyKey);
		}

		// 2. Carga del borrador unificado
		if (autosave.hasData(AUTOSAVE_KEY)) {
			const savedDraft = autosave.load<AutosaveDraft>(AUTOSAVE_KEY);

			// Comprobar si el borrador pertenece a la receta actual
			if (savedDraft && savedDraft.recipeId === recipeId) {
				const initialFormState: FormState = {
					title: initialData?.title ?? '',
					steps: getRecipeSteps(initialData?.steps),
					imageUrl: initialData?.imageUrl ?? null,
					urls: initialData?.urls.map((u) => u.url) ?? [],
					ingredients: mapInitialIngredients(initialData?.ingredients)
				};
				// Comparamos con el estado inicial para ver si vale la pena restaurar
				if (!areStatesIdentical(savedDraft.formData, initialFormState)) {
					status = 'awaitingDecision';
				} else {
					// El borrador es idéntico al del servidor, es inútil.
					autosave.clear(AUTOSAVE_KEY);
					status = 'editing';
				}
			} else {
				// El borrador es de otra receta, se ignora y se sobreescribirá.
				status = 'editing';
			}
		} else {
			// No hay ningún borrador.
			status = 'editing';
		}
	});

	autosave.createAutosave(
		AUTOSAVE_KEY,
		() => ({
			recipeId: recipeId,
			formData: formData
		}),
		{
			enabled: () => status === 'editing',
			isDirty: () => isFormDirty
		}
	);

	function handleRestore() {
		const savedDraft = autosave.load<AutosaveDraft>(AUTOSAVE_KEY);
		if (savedDraft && savedDraft.recipeId === recipeId) {
			const dataToRestore = savedDraft.formData;
			formData.title = dataToRestore.title;
			formData.steps = dataToRestore.steps;
			formData.imageUrl = dataToRestore.imageUrl ?? null; // Ensure null instead of undefined
			formData.urls = dataToRestore.urls;
			formData.ingredients = dataToRestore.ingredients;
		}
		status = 'editing';
	}

	function handleDiscard() {
		autosave.clear(AUTOSAVE_KEY);
		status = 'editing';
	}

	// --- Drag and Drop ---
	function handleDrop(state: DragDropState<IngredientWithDetails>) {
		const { draggedItem, targetElement } = state;
		if (!draggedItem || !targetElement) return;
		const sourceIndex = formData.ingredients.findIndex((item) => item.id === draggedItem.id);
		const targetRow = (targetElement as HTMLElement).closest('tr');
		if (!targetRow || !targetRow.parentElement) return;
		const targetIndex = Array.from(targetRow.parentElement.children).indexOf(targetRow);
		if (sourceIndex === -1 || targetIndex === -1) return;
		const reorderedIngredients = [...formData.ingredients];
		const [removed] = reorderedIngredients.splice(sourceIndex, 1);
		reorderedIngredients.splice(targetIndex, 0, removed);
		formData.ingredients = reorderedIngredients;
	}

	// --- Buscador de productos ---
	let searchResults: SearchResult[] = $state([]);
	let isSearching = $state(false);
	let open = $state(false);
	let inputValue = $state('');
	let searchTerm = $state('');
	let triggerWrapperEl: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (browser && open && triggerWrapperEl) {
			const contentEl = document.querySelector<HTMLDivElement>('[data-slot="popover-content"]');
			if (contentEl) {
				const rect = triggerWrapperEl.getBoundingClientRect();
				contentEl.style.width = `${rect.width}px`;
			}
		}
	});

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
			eventSource.addEventListener('stream_error', (e) => console.error('Error de stream:', e));
			eventSource.onerror = (err) => {
				console.error('Error en EventSource:', err);
				isSearching = false;
				eventSource?.close();
			};
			eventSource.addEventListener('close', () => {
				isSearching = false;
				eventSource?.close();
			});
		}
		return () => eventSource?.close();
	});

	async function addIngredient(result: SearchResult) {
		if (formData.ingredients.some((ing) => ing.id === result.id)) return;
		try {
			const response = await fetch(
				`/api/ingredients/details/${result.id}?source=${result.source}`
			);
			if (!response.ok) throw new Error('Failed to fetch ingredient details');
			const details: Omit<IngredientWithDetails, 'id' | 'source'> = await response.json();
			formData.ingredients.push({
				...details,
				id: result.id,
				source: result.source
			});
		} catch (error) {
			console.error('Error adding ingredient:', error);
			toast.error('No se pudieron obtener los detalles del ingrediente.');
		} finally {
			open = false;
			searchResults = [];
			searchTerm = '';
			inputValue = '';
		}
	}

	function removeIngredient(id: string) {
		formData.ingredients = formData.ingredients.filter((ing) => ing.id !== id);
	}

	// --- Gestión de imagen ---
	function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result;
				formData.imageUrl = typeof result === 'string' ? result : null;
			};
			reader.readAsDataURL(file);
		}
	}

	// --- Cálculos y envío ---
	let nutritionalInfo = $derived(calculateNutritionalInfo(formData.ingredients));
	let isSubmitting = $state(false);
</script>

<Card class="max-w-4xl mx-auto my-8">
	<CardHeader>
		<CardTitle class="mt-4">{cardTitle}</CardTitle>
		{#if status === 'awaitingDecision'}
			<Alert.Root class="mt-4">
				<Save class="h-4 w-4" />
				<Alert.Title>¡Borrador encontrado!</Alert.Title>
				<Alert.Description class="flex items-center justify-between">
					<p>Hemos encontrado un borrador guardado. ¿Quieres continuar donde lo dejaste?</p>
					<div class="flex gap-2 mt-2 md:mt-0">
						<Button type="button" size="sm" onclick={handleRestore}>Restaurar</Button>
						<Button type="button" variant="destructive" size="sm" onclick={handleDiscard}>
							<X class="h-4 w-4 mr-2" />
							Descartar
						</Button>
					</div>
				</Alert.Description>
			</Alert.Root>
		{/if}
	</CardHeader>
	<CardContent>
		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				const toastId = toast.loading('Guardando receta...');

				return async ({ result }) => {
					await applyAction(result);
					isSubmitting = false;

					if (result.type === 'success') {
						toast.success('Receta guardada con éxito.', { id: toastId });
						autosave.clear(AUTOSAVE_KEY);
						await onSuccess();
					} else if (result.type === 'failure') {
						const message = form?.message || 'Error al guardar la receta. Revisa los campos.';
						toast.error(message, { id: toastId });
					} else {
						toast.dismiss(toastId);
					}
				};
			}}
			class="space-y-6"
		>
			<!-- Campos ocultos -->
			<input
				type="hidden"
				name="ingredients"
				value={JSON.stringify(
					formData.ingredients.map(({ id, quantity, source }) => ({
						id,
						quantity,
						source
					}))
				)}
			/>
			<input
				type="hidden"
				name="urls"
				value={JSON.stringify(formData.urls.filter((u) => u.trim() !== ''))}
			/>
			<input
				type="hidden"
				name="steps"
				value={JSON.stringify(formData.steps.filter((s) => s.trim() !== ''))}
			/>
			<input type="hidden" name="imageUrl" value={formData.imageUrl ?? ''} />

			<!-- Campos del formulario -->
			<div class="space-y-2">
				<Label for="title">Título</Label>
				<Input id="title" name="title" bind:value={formData.title} required />
				{#if form?.errors?.title}
					<p class="text-sm text-red-500">{form.errors.title}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="image">Imagen de la Receta</Label>
				<div class="flex items-center gap-4">
					{#if formData.imageUrl}
						<img
							src={formData.imageUrl}
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
				<UrlImageFetcher bind:urls={formData.urls} bind:imageUrl={formData.imageUrl} />
				{#if form?.errors?.urls}
					<p class="text-sm text-red-500">{form.errors.urls}</p>
				{/if}
			</div>

			<div class="space-y-4">
				<Label class="text-lg font-medium">Pasos de la Receta</Label>
				{#each formData.steps as step, i}
					<div class="flex items-start gap-2">
						<div class="flex-1 space-y-1">
							<Label for={`step-${i}`} class="text-sm font-normal text-gray-600"
								>Paso {i + 1}</Label
							>
							<Textarea
								id={`step-${i}`}
								name={`step-${i}`}
								bind:value={formData.steps[i]}
								rows={3}
								placeholder="Describe este paso... (soporta Markdown)"
							/>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onclick={() => formData.steps.splice(i, 1)}
							class="mt-6"
							aria-label="Eliminar paso"
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>
				{/each}
				<Button type="button" variant="outline" onclick={() => formData.steps.push('')}>
					Añadir Paso
				</Button>
				{#if form?.errors?.steps}
					<p class="text-sm text-red-500">{form.errors.steps}</p>
				{/if}
			</div>

			<!-- Buscador y tabla de productos -->
			<div class="space-y-2">
				<Label>Añadir Ingrediente</Label>
				<div bind:this={triggerWrapperEl}>
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
						<Popover.Content class="p-0">
							<Command.Root filter={() => 1}>
								<Command.Input bind:value={searchTerm} placeholder="Buscar ingrediente..." />
								<Command.List>
									{#if searchResults.length > 0}
										{#each searchResults as result (result.id + result.source)}
											<Command.Item
												value={result.name}
												onSelect={() => {
													inputValue = result.name;
													addIngredient(result);
												}}
												class={cn(
													'flex items-center justify-between w-full',
													result.source === 'local' ? 'bg-muted/50' : ''
												)}
											>
												<div class="flex items-center gap-2">
													<img
														src={result.imageUrl || 'https://placehold.co/40x40?text=N/A'}
														alt={result.name}
														class="h-8 w-8 rounded-sm object-cover"
													/>
													<span>{result.name}</span>
												</div>
												{#if result.source === 'local'}
													<Database class="h-4 w-4 text-muted-foreground" />
												{/if}
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
			</div>

			<div class="space-y-2">
				<h3 class="text-lg font-medium">Productos de la Receta</h3>
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
						{#each formData.ingredients as ingredient, i (ingredient.id)}
							<tr
								use:draggable={{
									container: 'ingredients',
									dragData: ingredient,
									interactive: ['[data-quitar-btn]']
								}}
								class="hover:[&,&>svelte-css-wrapper]:[&>th,td]:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
							>
								<TableCell class="cursor-grab">
									<div class="flex items-center gap-2 text-muted-foreground">
										<GripVertical class="h-5 w-5" />
										<span class="text-sm font-medium">{i + 1}</span>
									</div>
								</TableCell>
								<TableCell>{ingredient.name}</TableCell>
								<TableCell>
									<Input
										type="number"
										value={ingredient.quantity}
										oninput={(e) => (ingredient.quantity = e.currentTarget.valueAsNumber)}
										min="0.1"
										step="any"
										class="w-full hide-arrows"
									/>
								</TableCell>
								<TableCell class="text-right">
									<Button
										type="button"
										variant="destructive"
										size="sm"
										data-quitar-btn
										onclick={() => removeIngredient(ingredient.id)}
									>
										Quitar
									</Button>
								</TableCell>
							</tr>
						{/each}
						{#if formData.ingredients.length === 0}
							<tr
								class="hover:[&,&>svelte-css-wrapper]:[&>th,td]:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
							>
								<TableCell colspan={4} class="text-center text-gray-500">
									Añade productos usando el buscador.
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
			<div class="space-y-2 p-4 border rounded-lg bg-muted/20">
				<h3 class="text-lg font-medium">Información Nutricional</h3>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<p class="font-bold text-xl">{nutritionalInfo.totalCalories.toFixed(1)}</p>
						<p class="text-sm text-muted-foreground">Calorías (kcal)</p>
					</div>
					<div>
						<p class="font-bold text-xl">{nutritionalInfo.totalProtein.toFixed(1)} g</p>
						<p class="text-sm font-semibold text-blue-500">Proteínas</p>
					</div>
					<div>
						<p class="font-bold text-xl">{nutritionalInfo.totalFat.toFixed(1)} g</p>
						<p class="text-sm font-semibold text-red-500">Grasas</p>
					</div>
					<div>
						<p class="font-bold text-xl">{nutritionalInfo.totalCarbs.toFixed(1)} g</p>
						<p class="text-sm font-semibold text-green-500">Carbohidratos</p>
					</div>
				</div>
			</div>

			<div class="flex justify-end">
				<Button type="submit" disabled={isSubmitting}>
					{submitButtonText}
				</Button>
			</div>
			{#if form?.message}
				<p class="text-sm text-red-500 text-right">{form.message}</p>
			{/if}
		</form>
	</CardContent>
</Card>
<style>
	:global(.hide-arrows::-webkit-inner-spin-button),
	:global(.hide-arrows::-webkit-outer-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}
	:global(.hide-arrows) {
		-moz-appearance: textfield;
		appearance: textfield;
	}
</style>

<!-- Ruta: src/lib/components/recipes/RecipeForm.svelte -->
<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';
	import { Save, X, Check, LoaderCircle } from 'lucide-svelte';

	import { createRecipeState, type FormState } from '$lib/models/RecipeFormState.svelte';
	import { calculateNutritionalInfo } from '$lib/recipeCalculator';
	import * as autosave from '$lib/runes/useAutosave.svelte';

	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Alert from '$lib/components/ui/alert';
	import UrlImageFetcher from '$lib/components/recipes/UrlImageFetcher.svelte';
	import RecipeStepsManager from './RecipeStepsManager.svelte';
	import IngredientsList from './IngredientsList.svelte';
	import IngredientSearch from './IngredientSearch.svelte';
	import NutritionalInfoPanel from './NutritionalInfoPanel.svelte';

	// --- Props ---
	let {
		initialData = null,
		form = null,
		cardTitle = 'Crear Nueva Receta',
		submitButtonText = 'Guardar Receta',
		onSuccess = async () => {},
		recipeId = null
	}: {
		initialData?: any | null;
		form?: { message?: string; errors?: Record<string, string | undefined> } | null;
		cardTitle?: string;
		submitButtonText?: string;
		onSuccess?: () => Promise<void>;
		recipeId?: string | null;
	} = $props();

	// --- Estado Centralizado y Acciones ---
	const recipe = createRecipeState(initialData);
	const formData = recipe.state;

	// --- Lógica de Autoguardado ---
	const autosaveKey = recipeId ? `recipe-draft-${recipeId}` : 'recipe-draft-new';
	let status = $state<'initializing' | 'awaitingDecision' | 'editing'>('initializing');

	const isFormDirty = $derived(
		JSON.stringify(recipe.initialFormState) !== JSON.stringify(formData)
	);

	const autosaveManager = autosave.createAutosave(
		autosaveKey,
		() => {
			// Excluimos el campo de la imagen para no superar la cuota de localStorage
			const { imageUrl, ...rest } = formData;
			return rest;
		},
		{
			enabled: () => status === 'editing',
			isDirty: () => isFormDirty
		}
	);

	onMount(() => {
		if (autosave.hasData(autosaveKey)) {
			const savedDraft = autosave.load<Omit<FormState, 'imageUrl'>>(autosaveKey);
			const { imageUrl, ...initialDraft } = recipe.initialFormState;

			if (savedDraft && JSON.stringify(savedDraft) !== JSON.stringify(initialDraft)) {
				status = 'awaitingDecision';
			} else {
				autosave.clear(autosaveKey);
				status = 'editing';
			}
		} else {
			status = 'editing';
		}
	});

	function handleRestore() {
		const savedDraft = autosave.load<Omit<FormState, 'imageUrl'>>(autosaveKey);
		if (savedDraft) {
			const { title, steps, urls, ingredients } = savedDraft;
			Object.assign(formData, { title, steps, urls, ingredients });
		}
		status = 'editing';
	}

	function handleDiscard() {
		autosave.clear(autosaveKey);
		status = 'editing';
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

<Card class="max-w-4xl mx-auto">
	<CardHeader class="flex flex-row items-center justify-between">
		<CardTitle class="mt-4">{cardTitle}</CardTitle>
		<div class="flex items-center gap-2 text-sm text-muted-foreground">
			{#if autosaveManager.status === 'saving'}
				<LoaderCircle class="h-4 w-4 animate-spin" />
				Guardando...
			{:else if autosaveManager.status === 'saved'}
				<Check class="h-4 w-4 text-green-500" />
				Guardado
			{:else if autosaveManager.status === 'error'}
				<X class="h-4 w-4 text-red-500" />
				Error al guardar
			{/if}
		</div>
	</CardHeader>
	<CardContent>
		{#if status === 'awaitingDecision'}
			<Alert.Root class="mb-6">
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
						autosave.clear(autosaveKey);
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
					formData.ingredients.map(({ id, quantity, source }) => ({ id, quantity, source }))
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
				value={JSON.stringify(formData.steps.map((s) => s.text).filter((s) => s.trim() !== ''))}
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

			<RecipeStepsManager
				steps={formData.steps}
				onAdd={recipe.addStep}
				onRemove={recipe.removeStep}
				onUpdateText={recipe.updateStepText}
				errors={form?.errors?.steps}
			/>

						<div class="space-y-4">
				<div class="space-y-2">
					<Label>Añadir Ingrediente</Label>
					<IngredientSearch onAdd={recipe.addIngredient} />
				</div>
				<IngredientsList
					ingredients={formData.ingredients}
					onRemove={recipe.removeIngredient}
					onReorder={recipe.reorderIngredients}
					errors={form?.errors?.ingredients}
				/>
			</div>

			<NutritionalInfoPanel info={nutritionalInfo} />

			<div class="flex justify-end">
				<Button type="submit" disabled={isSubmitting}>{submitButtonText}</Button>
			</div>
			{#if form?.message}
				<p class="text-sm text-red-500 text-right">{form.message}</p>
			{/if}
		</form>
	</CardContent>
</Card>
{#if ['saving', 'saved', 'error'].includes(autosaveManager.status)}
	<div
		class="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background p-3 text-sm text-muted-foreground shadow-lg"
		transition:fly={{ y: 20, duration: 300 }}
	>
		{#if autosaveManager.status === 'saving'}
			<LoaderCircle class="h-4 w-4 animate-spin" />
			Guardando borrador...
		{:else if autosaveManager.status === 'saved'}
			<Check class="h-4 w-4 text-green-500" />
			Borrador guardado
		{:else if autosaveManager.status === 'error'}
			<X class="h-4 w-4 text-red-500" />
			Error al guardar
		{/if}
	</div>
{/if}
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
<!-- Ruta: src/lib/components/diary/EditEntryDialog.svelte -->
<script lang="ts">
	import { calculateNutritionalInfo, type CalculableProduct } from '$lib/recipeCalculator';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { DiaryEntry } from '@prisma/client';
	
	type IngredientJson = {
		id: string;
		name: string;
		quantity: number;
		baseValues: Omit<CalculableProduct, 'quantity'>;
	};
	
	type EditableIngredient = IngredientJson;
	
	let { entry, open = $bindable(), onOpenChange, onSave }: {
		entry: DiaryEntry | null;
		open?: boolean;
		onOpenChange: (isOpen: boolean) => void;
		onSave: (updatedEntry: DiaryEntry) => void;
	} = $props();
	
	let editableQuantity = $state(0);
	let editableIngredients = $state<EditableIngredient[]>([]);
	
	$effect(() => {
		if (open && entry) {
			if (entry.type === 'PRODUCT') {
				editableQuantity = entry.quantity;
				editableIngredients = [];
			} else if (entry.type === 'RECIPE' && entry.ingredients) {
				// Aseguramos que el JSON es un array antes de asignarlo
				const ingredients = entry.ingredients;
				if (Array.isArray(ingredients)) {
					editableIngredients = ingredients as EditableIngredient[];
				}
				editableQuantity = 0;
			}
		} else {
			editableQuantity = 0;
			editableIngredients = [];
		}
	});
	
	const originalTotals = $derived(
	entry
	? {
		totalCalories: entry.calories,
		totalProtein: entry.protein,
		totalFat: entry.fat,
		totalCarbs: entry.carbs
	}
	: null
	);
	
	const newTotals = $derived(
	entry?.type === 'PRODUCT'
	? calculateNutritionalInfo([
	{
		calories: entry.calories / entry.quantity * editableQuantity,
		protein: entry.protein / entry.quantity * editableQuantity,
		fat: entry.fat / entry.quantity * editableQuantity,
		carbs: entry.carbs / entry.quantity * editableQuantity,
		quantity: editableQuantity
	}
	])
	: calculateNutritionalInfo(
	editableIngredients.map((ing) => ({
		...ing.baseValues,
		quantity: Number(ing.quantity) || 0
	}))
	)
	);
	
	function handleSaveChanges() {
		if (!entry) return;
		
		const updatedEntry: DiaryEntry = {
			...entry,
			quantity: entry.type === 'PRODUCT' ? editableQuantity : entry.quantity,
			calories: newTotals.totalCalories,
			protein: newTotals.totalProtein,
			fat: newTotals.totalFat,
			carbs: newTotals.totalCarbs,
			ingredients:
			entry.type === 'RECIPE'
			? (editableIngredients as unknown as import('@prisma/client').Prisma.JsonArray)
			: null
		};
		
		onSave(updatedEntry);
		onOpenChange(false);
	}
</script>

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Content class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Editar entrada: {entry?.name}</Dialog.Title>
			<Dialog.Description>
				Ajusta las cantidades para esta entrada. Los cambios se guardarán en tu diario.
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="grid gap-4 py-4">
			{#if entry?.type === 'PRODUCT'}
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="quantity" class="text-right">Cantidad (g)</Label>
				<Input id="quantity" type="number" bind:value={editableQuantity} class="col-span-3" />
			</div>
			{:else if entry?.type === 'RECIPE'}
			{#each editableIngredients as ingredient (ingredient.id)}
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for={ingredient.id} class="text-right col-span-2">{ingredient.name}</Label>
				<Input
				id={ingredient.id}
				type="number"
				bind:value={ingredient.quantity}
				class="col-span-2"
				/>
			</div>
			{/each}
			{/if}
		</div>
		
		<hr />
		
		<div class="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
			<h3 class="font-semibold col-span-2">Comparativa</h3>
			
			<div class="font-medium text-muted-foreground">Original</div>
			<div class="font-medium text-muted-foreground">Nuevo</div>
			
			<div>Calorías: {originalTotals?.totalCalories.toFixed(0) ?? 0} kcal</div>
			<div class="font-semibold">Calorías: {newTotals.totalCalories.toFixed(0)} kcal</div>
			
			<div>Proteínas: {originalTotals?.totalProtein.toFixed(1) ?? 0} g</div>
			<div class="font-semibold">Proteínas: {newTotals.totalProtein.toFixed(1)} g</div>
			
			<div>Grasas: {originalTotals?.totalFat.toFixed(1) ?? 0} g</div>
			<div class="font-semibold">Grasas: {newTotals.totalFat.toFixed(1)} g</div>
			
			<div>Carbs: {originalTotals?.totalCarbs.toFixed(1) ?? 0} g</div>
			<div class="font-semibold">Carbs: {newTotals.totalCarbs.toFixed(1)} g</div>
		</div>
		
		<Dialog.Footer>
			<Button variant="outline" onclick={() => onOpenChange(false)}>Cancelar</Button>
			<Button onclick={handleSaveChanges}>Guardar cambios</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

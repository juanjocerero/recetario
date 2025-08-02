<!--
// Fichero: src/lib/components/recipes/EditQuantitiesDialog.svelte
// --- VERSIÓN CORREGIDA (3) PARA SVELTE 5 ---
-->
<script lang="ts">
	import { calculateNutritionalInfo, type CalculableIngredient } from '$lib/recipeCalculator';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	type Recipe = {
		id: string;
		title: string;
		ingredients: {
			quantity: number;
			product: {
				id: string;
				name: string;
				calories: number | null;
				protein: number | null;
				fat: number | null;
				carbs: number | null;
			} | null;
			customIngredient: {
				id: string;
				name: string;
				calories: number | null;
				protein: number | null;
				fat: number | null;
				carbs: number | null;
			} | null;
		}[];
	};

	let { recipe, open = $bindable(), onOpenChange }: {
		recipe: Recipe | null;
		open?: boolean;
		onOpenChange: (isOpen: boolean) => void;
	} = $props();

	let editableIngredients = $state<
		{
			id: string;
			name: string;
			quantity: number;
			baseValues: Omit<CalculableIngredient, 'quantity'>;
		}[]
	>([]);

	$effect(() => {
		if (open && recipe) {
			editableIngredients = recipe.ingredients.map((ing) => {
				const source = ing.product || ing.customIngredient;
				const id = ing.product?.id || ing.customIngredient?.id || '';
				const name = ing.product?.name || ing.customIngredient?.name || 'Ingrediente desconocido';

				return {
					id,
					name,
					quantity: ing.quantity,
					baseValues: {
						calories: source?.calories,
						protein: source?.protein,
						fat: source?.fat,
						carbs: source?.carbs
					}
				};
			});
		} else {
			editableIngredients = [];
		}
	});

	const originalTotals = $derived(
		recipe ? calculateNutritionalInfo(recipe.ingredients.map(ing => {
			const source = ing.product || ing.customIngredient;
			return {
				quantity: ing.quantity,
				calories: source?.calories,
				protein: source?.protein,
				fat: source?.fat,
				carbs: source?.carbs
			}
		})) : null
	);

	const newTotals = $derived(
		calculateNutritionalInfo(
			editableIngredients.map((ing) => ({
				...ing.baseValues,
				quantity: Number(ing.quantity) || 0
			}))
		)
	);
</script>

<Dialog.Root bind:open onOpenChange={onOpenChange}>
	<Dialog.Content class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Editar Cantidades: {recipe?.title}</Dialog.Title>
			<Dialog.Description>
				Ajusta las cantidades en gramos para esta preparación específica. Los cambios no afectarán a
				la receta original.
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4 py-4">
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
		</div>

		<hr />

		<!-- Justificación: Se añade un data-testid al contenedor para poder seleccionarlo
		     de forma inequívoca en los tests. -->
		<div data-testid="comparison-section" class="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
			<h3 class="font-semibold col-span-2">Comparativa Nutricional</h3>

			<div class="font-medium text-muted-foreground">Original</div>
			<div class="font-medium text-muted-foreground">Recalculado</div>

			<div>Calorías: {originalTotals?.totalCalories.toFixed(0) ?? 0} kcal</div>
			<div class="font-semibold">Calorías: {newTotals.totalCalories.toFixed(0)} kcal</div>

			<div>Proteínas: {originalTotals?.totalProtein.toFixed(1) ?? 0} g</div>
			<div class="font-semibold">Proteínas: {newTotals.totalProtein.toFixed(1)} g</div>

			<div>Grasas: {originalTotals?.totalFat.toFixed(1) ?? 0} g</div>
			<div class="font-semibold">Grasas: {newTotals.totalFat.toFixed(1)} g</div>

			<div>Carbohidratos: {originalTotals?.totalCarbs.toFixed(1) ?? 0} g</div>
			<div class="font-semibold">Carbohidratos: {newTotals.totalCarbs.toFixed(1)} g</div>
		</div>

		<Dialog.Footer>
			<!-- Justificación: Se añade un data-testid al botón para seleccionarlo sin ambigüedad. -->
			<Button data-testid="dialog-close-button" onclick={() => onOpenChange(false)}>Cerrar</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Fichero: src/lib/components/recipes/EditQuantitiesDialog.svelte -->
<script lang="ts">
	import { calculateNutritionalInfo, type CalculableProduct } from '$lib/recipeCalculator';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import IngredientListEditor from '../shared/IngredientListEditor.svelte';
	import NutritionalComparison from '../shared/NutritionalComparison.svelte';

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
			};
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
			baseValues: Omit<CalculableProduct, 'quantity'>;
		}[]
	>([]);

	$effect(() => {
		if (open && recipe) {
			editableIngredients = recipe.ingredients.map((ing) => {
				const source = ing.product;
				const id = source.id;
				const name = source.name;

				return {
					id,
					name,
					quantity: ing.quantity,
					baseValues: {
						calories: source.calories,
						protein: source.protein,
						fat: source.fat,
						carbs: source.carbs
					}
				};
			});
		} else {
			editableIngredients = [];
		}
	});

	const originalTotals = $derived(
		recipe
			? calculateNutritionalInfo(
					recipe.ingredients.map((ing) => {
						const source = ing.product;
						return {
							quantity: ing.quantity,
							calories: source.calories,
							protein: source.protein,
							fat: source.fat,
							carbs: source.carbs
						};
					})
				)
			: null
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

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Content class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Editar cantidades: {recipe?.title}</Dialog.Title>
			<Dialog.Description>
				Ajusta las cantidades en gramos para esta preparación específica. Los cambios no afectarán a
				la receta original.
			</Dialog.Description>
		</Dialog.Header>

		<div class="max-h-[40vh] overflow-y-auto pr-2">
			<IngredientListEditor ingredients={editableIngredients} />
		</div>

		<hr />

		<NutritionalComparison original={originalTotals} current={newTotals} />

		<Dialog.Footer>
			<!-- Justificación: Se añade un data-testid al botón para seleccionarlo sin ambigüedad. -->
			<Button data-testid="dialog-close-button" onclick={() => onOpenChange(false)}>Cerrar</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
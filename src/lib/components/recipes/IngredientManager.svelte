<!-- src/lib/components/recipes/IngredientManager.svelte -->
<script lang="ts">
	import IngredientSearch from './IngredientSearch.svelte';
	import IngredientsList from './IngredientsList.svelte';
	import { Label } from '$lib/components/ui/label';
	import type { CalculableProduct } from '$lib/recipeCalculator';

	type IngredientWithDetails = CalculableProduct & {
		id: string;
		name: string;
		source: 'local' | 'off';
		imageUrl?: string | null;
	};

	let {
		ingredients,
		onUpdate,
		errors
	}: {
		ingredients: IngredientWithDetails[];
		onUpdate: (ingredients: IngredientWithDetails[]) => void;
		errors?: string;
	} = $props();

	function handleAdd(newIngredient: IngredientWithDetails) {
		if (!ingredients.some((ing) => ing.id === newIngredient.id)) {
			onUpdate([...ingredients, newIngredient]);
		}
	}
</script>

<div class="space-y-2">
	<Label>Añadir Ingrediente</Label>
	<IngredientSearch onAdd={handleAdd} />
</div>

<IngredientsList {ingredients} onUpdate={onUpdate} {errors} />
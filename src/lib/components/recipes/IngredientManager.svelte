<!-- src/lib/components/recipes/IngredientManager.svelte -->
<script lang="ts">
	import IngredientSearch from './IngredientSearch.svelte';
	import IngredientsList from './IngredientsList.svelte';
	import { Label } from '$lib/components/ui/label';
	import type { IngredientWithDetails } from '$lib/models/RecipeFormState.svelte';

	let {
		ingredients,
		onAdd,
		onRemove,
		onReorder,
		errors
	}: {
		ingredients: IngredientWithDetails[];
		onAdd: (ingredient: IngredientWithDetails) => void;
		onRemove: (id: string) => void;
		onReorder: (sourceIndex: number, targetIndex: number) => void;
		errors?: string;
	} = $props();
</script>

<div class="space-y-2">
	<Label>Añadir Ingrediente</Label>
	<IngredientSearch onAdd={onAdd} />
</div>

<IngredientsList {ingredients} onRemove={onRemove} onReorder={onReorder} {errors} />

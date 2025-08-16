
<!-- src/lib/components/shared/IngredientListEditor.svelte -->
<script lang="ts">
	import { Input } from '../ui/input/index.js';
	import { Label } from '../ui/label/index.js';

	type EditableIngredient = {
		id: string;
		name: string;
		quantity: number;
	};

	let { ingredients }: { ingredients: EditableIngredient[] } = $props();
</script>

<div class="grid gap-4 py-4">
	{#each ingredients as ingredient (ingredient.id)}
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

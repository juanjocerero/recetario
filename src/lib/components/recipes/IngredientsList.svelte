<!-- src/lib/components/recipes/IngredientsList.svelte -->
<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Table, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { GripVertical, Trash2 } from 'lucide-svelte';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
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

	function removeIngredient(id: string) {
		onUpdate(ingredients.filter((ing) => ing.id !== id));
	}

	function handleDrop(state: DragDropState<IngredientWithDetails>) {
		const { draggedItem, targetElement } = state;
		if (!draggedItem || !targetElement) return;
		const sourceIndex = ingredients.findIndex((item) => item.id === draggedItem.id);
		const targetRow = (targetElement as HTMLElement).closest('tr');
		if (!targetRow || !targetRow.parentElement) return;
		const targetIndex = Array.from(targetRow.parentElement.children).indexOf(targetRow);
		if (sourceIndex === -1 || targetIndex === -1) return;

		const reorderedIngredients = [...ingredients];
		const [removed] = reorderedIngredients.splice(sourceIndex, 1);
		reorderedIngredients.splice(targetIndex, 0, removed);

		onUpdate(reorderedIngredients);
	}
</script>

<div class="space-y-2">
	<h3 class="text-lg font-medium">Productos de la Receta</h3>
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead class="w-[50px] hidden md:table-cell"></TableHead>
				<TableHead>Nombre</TableHead>
				<TableHead class="w-[100px]">Cantidad (g)</TableHead>
				<TableHead class="w-[80px] text-right">Acciones</TableHead>
			</TableRow>
		</TableHeader>
		<tbody use:droppable={{ container: 'ingredients', callbacks: { onDrop: handleDrop } }}>
			{#each ingredients as ingredient, i (ingredient.id)}
				<tr
					use:draggable={{ container: 'ingredients', dragData: ingredient, interactive: ['[data-quitar-btn]'] }}
					class="hover:[&,&>svelte-css-wrapper]:[&>th,td]:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
				>
					<TableCell class="cursor-grab hidden md:table-cell">
						<div class="flex items-center gap-2 text-muted-foreground">
							<GripVertical class="h-5 w-5" />
							<span class="text-sm font-medium">{i + 1}</span>
						</div>
					</TableCell>
					<TableCell class="max-w-[170px] whitespace-normal md:max-w-none">
						{ingredient.name}
					</TableCell>
					<TableCell>
						<Input
							type="number"
							bind:value={ingredient.quantity}
							min="0.1"
							step="any"
							class="w-full hide-arrows"
						/>
					</TableCell>
					<TableCell class="text-right">
						<Button
							type="button"
							variant="destructive"
							size="icon"
							data-quitar-btn
							onclick={() => removeIngredient(ingredient.id)}
							aria-label="Quitar ingrediente"
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</TableCell>
				</tr>
			{/each}
			{#if ingredients.length === 0}
				<tr class="hover:[&,&>svelte-css-wrapper]:[&>th,td]:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
					<TableCell colspan={4} class="text-center text-gray-500">
						Añade productos usando el buscador.
					</TableCell>
				</tr>
			{/if}
		</tbody>
	</Table>
	{#if errors}
		<p class="text-sm text-red-500">{errors}</p>
	{/if}
</div>
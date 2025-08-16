<!-- src/lib/components/recipes/RecipeStepsManager.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { GripVertical, Trash2 } from 'lucide-svelte';
	import type { RecipeStep } from '$lib/models/RecipeFormState.svelte';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';

	let {
		steps,
		onAdd,
		onRemove,
		onUpdateText,
		onReorder,
		errors
	}: {
		steps: RecipeStep[];
		onAdd: () => void;
		onRemove: (id: string) => void;
		onUpdateText: (id: string, text: string) => void;
		onReorder: (sourceIndex: number, targetIndex: number) => void;
		errors?: string;
	} = $props();

	function handleDrop(state: DragDropState<RecipeStep>) {
		const { draggedItem, targetElement } = state;
		if (!draggedItem || !targetElement) return;
		const sourceIndex = steps.findIndex((item) => item.id === draggedItem.id);
		const targetDiv = (targetElement as HTMLElement).closest('[data-draggable-step]');
		if (!targetDiv || !targetDiv.parentElement) return;
		const targetIndex = Array.from(targetDiv.parentElement.children).indexOf(targetDiv);
		if (sourceIndex === -1 || targetIndex === -1) return;

		onReorder(sourceIndex, targetIndex);
	}
</script>

<div class="space-y-4">
	<Label class="text-lg font-medium">Pasos de la Receta</Label>
	<div use:droppable={{ container: 'steps', callbacks: { onDrop: handleDrop } }} class="space-y-4">
		{#each steps as step, i (step.id)}
			<div
				use:draggable={{ container: 'steps', dragData: step, interactive: ['[data-eliminar-btn]'] }}
				data-draggable-step
				class="flex items-start gap-2"
			>
				<div class="flex items-center gap-2 text-muted-foreground pt-7">
					<GripVertical class="h-5 w-5 cursor-grab" />
				</div>
				<div class="flex-1 space-y-1">
					<Label for={step.id} class="text-sm font-normal text-gray-600">Paso {i + 1}</Label>
					<Textarea
						id={step.id}
						name={`step-${step.id}`}
						value={step.text}
						oninput={(e) => onUpdateText(step.id, e.currentTarget.value)}
						rows={3}
						placeholder="Describe este paso... (soporta Markdown)"
					/>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onclick={() => onRemove(step.id)}
					class="mt-6"
					aria-label="Eliminar paso"
					data-eliminar-btn
				>
					<Trash2 class="h-4 w-4" />
				</Button>
			</div>
		{/each}
	</div>
	<Button type="button" variant="outline" onclick={onAdd}>Añadir Paso</Button>
	{#if errors}
		<p class="text-sm text-red-500">{errors}</p>
	{/if}
</div>
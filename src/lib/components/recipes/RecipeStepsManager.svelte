<!-- src/lib/components/recipes/RecipeStepsManager.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Trash2 } from 'lucide-svelte';
	import type { RecipeStep } from '$lib/models/RecipeFormState.svelte';

	let {
		steps,
		onUpdate,
		errors
	}: {
		steps: RecipeStep[];
		onUpdate: (steps: RecipeStep[]) => void;
		errors?: string;
	} = $props();

	function addStep() {
		onUpdate([...steps, { id: crypto.randomUUID(), text: '' }]);
	}

	function removeStep(id: string) {
		onUpdate(steps.filter((step) => step.id !== id));
	}

	function handleStepInput(id: string, value: string) {
		const newSteps = [...steps];
		const stepIndex = newSteps.findIndex((step) => step.id === id);
		if (stepIndex !== -1) {
			newSteps[stepIndex].text = value;
			onUpdate(newSteps);
		}
	}
</script>

<div class="space-y-4">
	<Label class="text-lg font-medium">Pasos de la Receta</Label>
	{#each steps as step, i (step.id)}
		<div class="flex items-start gap-2">
			<div class="flex-1 space-y-1">
				<Label for={step.id} class="text-sm font-normal text-gray-600">Paso {i + 1}</Label>
				<Textarea
					id={step.id}
					name={`step-${step.id}`}
					value={step.text}
					oninput={(e) => handleStepInput(step.id, e.currentTarget.value)}
					rows={3}
					placeholder="Describe este paso... (soporta Markdown)"
				/>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onclick={() => removeStep(step.id)}
				class="mt-6"
				aria-label="Eliminar paso"
			>
				<Trash2 class="h-4 w-4" />
			</Button>
		</div>
	{/each}
	<Button type="button" variant="outline" onclick={addStep}>Añadir Paso</Button>
	{#if errors}
		<p class="text-sm text-red-500">{errors}</p>
	{/if}
</div>
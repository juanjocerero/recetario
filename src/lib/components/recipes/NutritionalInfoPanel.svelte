<!-- src/lib/components/recipes/NutritionalInfoPanel.svelte -->
<script lang="ts">
	import type { NutritionalInfo } from '$lib/recipeCalculator';

	let { info }: { info: NutritionalInfo } = $props();
</script>

<div class="space-y-2 p-4 border rounded-lg bg-muted/20">
	<h3 class="text-lg font-medium">Información Nutricional</h3>
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div>
			<p class="font-bold text-xl">{info.totalCalories.toFixed(1)}</p>
			<p class="text-sm text-muted-foreground">Calorías (kcal)</p>
		</div>
		<div>
			<p class="font-bold text-xl">{info.totalProtein.toFixed(1)} g</p>
			<p class="text-sm font-semibold text-blue-500">Proteínas</p>
		</div>
		<div>
			<p class="font-bold text-xl">{info.totalFat.toFixed(1)} g</p>
			<p class="text-sm font-semibold text-red-500">Grasas</p>
		</div>
		<div>
			<p class="font-bold text-xl">{info.totalCarbs.toFixed(1)} g</p>
			<p class="text-sm font-semibold text-green-500">Carbohidratos</p>
		</div>
	</div>
</div>


<!-- src/lib/components/shared/NutritionalComparison.svelte -->
<script lang="ts">
	type Totals = {
		totalCalories: number;
		totalProtein: number;
		totalFat: number;
		totalCarbs: number;
	} | null;

	let { original, current }: { original: Totals; current: Totals } = $props();
</script>

<div data-testid="comparison-section" class="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
	<h3 class="font-semibold col-span-2">Comparativa</h3>

	<div class="font-medium text-muted-foreground">Original</div>
	<div class="font-medium text-muted-foreground">Nuevo</div>

	<div>Calorías: {original?.totalCalories.toFixed(0) ?? 0} kcal</div>
	<div class="font-semibold">Calorías: {current?.totalCalories.toFixed(0) ?? 0} kcal</div>

	<div>Proteínas: {original?.totalProtein.toFixed(1) ?? 0} g</div>
	<div class="font-semibold">Proteínas: {current?.totalProtein.toFixed(1) ?? 0} g</div>

	<div>Grasas: {original?.totalFat.toFixed(1) ?? 0} g</div>
	<div class="font-semibold">Grasas: {current?.totalFat.toFixed(1) ?? 0} g</div>

	<div>Carbs: {original?.totalCarbs.toFixed(1) ?? 0} g</div>
	<div class="font-semibold">Carbs: {current?.totalCarbs.toFixed(1) ?? 0} g</div>
</div>

<!-- Ruta: src/lib/components/diary/NutritionalSummary.svelte -->
<script lang="ts">
	import MacroBar from '$lib/components/shared/MacroBar.svelte';
	import type { AggregatedNutrients } from '$lib/server/services/diaryService';

	let {
		nutrients,
		days
	}: {
		nutrients: AggregatedNutrients;
		days: number;
	} = $props();
</script>

<div class="space-y-6">
	<!-- Totales del Periodo -->
	<div>
		<h3 class="text-lg font-semibold mb-2">Totales del Periodo ({days} día{days > 1 ? 's' : ''})</h3>
		<div class="p-4 border rounded-lg bg-muted/50">
			<div class="flex justify-between items-baseline mb-2">
				<span class="text-sm font-medium">Calorías</span>
				<span class="text-lg font-bold">{nutrients.total.calories.toFixed(0)} kcal</span>
			</div>
			<MacroBar
				protein={nutrients.total.protein}
				carbs={nutrients.total.carbs}
				fat={nutrients.total.fat}
			/>
		</div>
	</div>

	<!-- Promedio Diario -->
	{#if days > 1}
		<div>
			<h3 class="text-lg font-semibold mb-2">Promedio Diario</h3>
			<div class="p-4 border rounded-lg bg-muted/50">
				<div class="flex justify-between items-baseline mb-2">
					<span class="text-sm font-medium">Calorías</span>
					<span class="text-lg font-bold">{nutrients.average.calories.toFixed(0)} kcal</span>
				</div>
				<MacroBar
					protein={nutrients.average.protein}
					carbs={nutrients.average.carbs}
					fat={nutrients.average.fat}
				/>
			</div>
		</div>
	{/if}
</div>

<!-- Ruta: src/lib/components/diary/NutritionalSummary.svelte -->
<script lang="ts">
	import MacroBar from '$lib/components/shared/MacroBar.svelte';
	import type { AggregatedNutrients } from '$lib/utils';
	import { Skeleton } from '$lib/components/ui/skeleton';
	
	let {
		nutrients,
		days,
		isLoading = false
	}: {
		nutrients: AggregatedNutrients;
		days: number;
		isLoading?: boolean;
	} = $props();
</script>

<div class="space-y-6">
	{#if isLoading}
	<!-- Skeleton for Totales -->
	<div class="space-y-2">
		<Skeleton class="h-6 w-48" />
		<div class="p-4 border rounded-lg bg-muted/50 space-y-3">
			<div class="flex justify-between items-baseline">
				<Skeleton class="h-5 w-16" />
				<Skeleton class="h-6 w-24" />
			</div>
			<Skeleton class="h-5 w-full" />
		</div>
	</div>
	<!-- Skeleton for Promedio -->
	<div class="space-y-2">
		<Skeleton class="h-6 w-40" />
		<div class="p-4 border rounded-lg bg-muted/50 space-y-3">
			<div class="flex justify-between items-baseline">
				<Skeleton class="h-5 w-16" />
				<Skeleton class="h-6 w-24" />
			</div>
			<Skeleton class="h-5 w-full" />
		</div>
	</div>
	{:else}
	<!-- Totales del Periodo -->
	<div>
		<h3 class="text-lg font-semibold mb-2">Total del período ({days} día{days > 1 ? 's' : ''})</h3>
		<div class="p-4 border rounded-lg bg-muted/50">
			<div class="flex justify-between items-baseline mb-2">
				<span class="text-sm font-medium">Calorías</span>
				<span class="text-lg font-bold"
				>{nutrients.total.calories.toLocaleString('es-ES', {
					maximumFractionDigits: 0
				})} kcal</span
				>
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
		<h3 class="text-lg font-semibold mb-2">Promedio diario</h3>
		<div class="p-4 border rounded-lg bg-muted/50">
			<div class="flex justify-between items-baseline mb-2">
				<span class="text-sm font-medium">Calorías</span>
				<span class="text-lg font-bold"
				>{nutrients.average.calories.toLocaleString('es-ES', {
					maximumFractionDigits: 0
				})} kcal</span
				>
			</div>
			<MacroBar
			protein={nutrients.average.protein}
			carbs={nutrients.average.carbs}
			fat={nutrients.average.fat}
			/>
		</div>
	</div>
	{/if}
	{/if}
</div>
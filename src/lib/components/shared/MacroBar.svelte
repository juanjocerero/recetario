<script lang="ts">
	type Props = {
		protein: number | null;
		carbs: number | null;
		fat: number | null;
	};
	const { protein, carbs, fat }: Props = $props();

	const p = $derived(protein ?? 0);
	const c = $derived(carbs ?? 0);
	const f = $derived(fat ?? 0);

	const totalGrams = $derived(p + c + f);

	const proteinPercentage = $derived(totalGrams > 0 ? (p / totalGrams) * 100 : 0);
	const carbsPercentage = $derived(totalGrams > 0 ? (c / totalGrams) * 100 : 0);
	const fatPercentage = $derived(totalGrams > 0 ? (f / totalGrams) * 100 : 0);
</script>

<div class="w-full">
	<div class="flex h-2 w-full overflow-hidden rounded-full bg-muted">
		<div
			class="bg-blue-500"
			style="width: {proteinPercentage}%"
			title="Proteínas: {p.toFixed(1)}g"
		></div>
		<div
			class="bg-green-500"
			style="width: {carbsPercentage}%"
			title="Carbohidratos: {c.toFixed(1)}g"
		></div>
		<div
			class="bg-red-500"
			style="width: {fatPercentage}%"
			title="Grasas: {f.toFixed(1)}g"
		></div>
	</div>
	<div class="mt-2 flex justify-between text-xs text-muted-foreground">
		<span class="flex items-center">
			<span class="mr-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
			P ({p.toFixed(1)})
		</span>
		<span class="flex items-center">
			<span class="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
			C ({c.toFixed(1)})
		</span>
		<span class="flex items-center">
			<span class="mr-1.5 h-2 w-2 rounded-full bg-red-500"></span>
			G ({f.toFixed(1)})
		</span>
	</div>
</div>

<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Trash2 from 'lucide-svelte/icons/trash-2';

	// --- Tipos ---
	type RangeFilter = { min?: number; max?: number };
	export type GramFilters = {
		calories: RangeFilter;
		protein: RangeFilter;
		carbs: RangeFilter;
		fat: RangeFilter;
	};
	export type PercentFilters = {
		protein: RangeFilter;
		carbs: RangeFilter;
		fat: RangeFilter;
	};

	// --- Props (Svelte 5) ---
	let {
		gramFilters,
		percentFilters,
		onGramsChange,
		onPercentChange,
		onClear
	}: {
		gramFilters: GramFilters;
		percentFilters: PercentFilters;
		onGramsChange: (macro: keyof GramFilters, key: 'min' | 'max', value: number | undefined) => void;
		onPercentChange: (macro: keyof PercentFilters, key: 'min' | 'max', value: number | undefined) => void;
		onClear: () => void;
	} = $props();

	// Justificación: Los manejadores de eventos ahora invocan los callbacks
	// pasados por el padre en lugar de mutar props. Esto respeta la propiedad
	// del estado y sigue el flujo de datos unidireccional de Svelte 5.
	function handleGramsInput(macro: keyof GramFilters, key: 'min' | 'max', e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const value = target.valueAsNumber;
		onGramsChange(macro, key, isNaN(value) ? undefined : value);
	}

	function handlePercentInput(macro: keyof PercentFilters, key: 'min' | 'max', e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const value = target.valueAsNumber;
		onPercentChange(macro, key, isNaN(value) ? undefined : value);
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold">Macronutrientes</h3>
		<Button onclick={onClear} variant="ghost" size="icon" aria-label="Limpiar filtros de macros">
			<Trash2 class="h-4 w-4" />
		</Button>
	</div>

	<!-- Filtros de Gramos y Calorías -->
	<div class="space-y-4">
		<div class="space-y-2">
			<Label for="calories-min">Calorías (kcal)</Label>
			<div class="flex gap-2">
				<Input id="calories-min" type="number" placeholder="Min" class="hide-arrows" value={gramFilters.calories.min ?? ''} oninput={(e) => handleGramsInput('calories', 'min', e)} />
				<Input id="calories-max" type="number" placeholder="Max" class="hide-arrows" value={gramFilters.calories.max ?? ''} oninput={(e) => handleGramsInput('calories', 'max', e)} />
			</div>
		</div>
		<div class="space-y-2">
			<Label for="protein-grams-min">Proteínas (g)</Label>
			<div class="flex gap-2">
				<Input id="protein-grams-min" type="number" placeholder="Min" class="hide-arrows" value={gramFilters.protein.min ?? ''} oninput={(e) => handleGramsInput('protein', 'min', e)} />
				<Input id="protein-grams-max" type="number" placeholder="Max" class="hide-arrows" value={gramFilters.protein.max ?? ''} oninput={(e) => handleGramsInput('protein', 'max', e)} />
			</div>
		</div>
		<div class="space-y-2">
			<Label for="carbs-grams-min">Carbohidratos (g)</Label>
			<div class="flex gap-2">
				<Input id="carbs-grams-min" type="number" placeholder="Min" class="hide-arrows" value={gramFilters.carbs.min ?? ''} oninput={(e) => handleGramsInput('carbs', 'min', e)} />
				<Input id="carbs-grams-max" type="number" placeholder="Max" class="hide-arrows" value={gramFilters.carbs.max ?? ''} oninput={(e) => handleGramsInput('carbs', 'max', e)} />
			</div>
		</div>
		<div class="space-y-2">
			<Label for="fat-grams-min">Grasas (g)</Label>
			<div class="flex gap-2">
				<Input id="fat-grams-min" type="number" placeholder="Min" class="hide-arrows" value={gramFilters.fat.min ?? ''} oninput={(e) => handleGramsInput('fat', 'min', e)} />
				<Input id="fat-grams-max" type="number" placeholder="Max" class="hide-arrows" value={gramFilters.fat.max ?? ''} oninput={(e) => handleGramsInput('fat', 'max', e)} />
			</div>
		</div>
	</div>

	<hr/>

	<!-- Filtros de Porcentaje -->
	<div class="space-y-4">
		<div class="space-y-2">
			<Label for="protein-percent-min">Proteínas (%)</Label>
			<div class="flex gap-2">
				<Input id="protein-percent-min" type="number" placeholder="Min" class="hide-arrows" value={percentFilters.protein.min ?? ''} oninput={(e) => handlePercentInput('protein', 'min', e)} />
				<Input id="protein-percent-max" type="number" placeholder="Max" class="hide-arrows" value={percentFilters.protein.max ?? ''} oninput={(e) => handlePercentInput('protein', 'max', e)} />
			</div>
		</div>
		<div class="space-y-2">
			<Label for="carbs-percent-min">Carbohidratos (%)</Label>
			<div class="flex gap-2">
				<Input id="carbs-percent-min" type="number" placeholder="Min" class="hide-arrows" value={percentFilters.carbs.min ?? ''} oninput={(e) => handlePercentInput('carbs', 'min', e)} />
				<Input id="carbs-percent-max" type="number" placeholder="Max" class="hide-arrows" value={percentFilters.carbs.max ?? ''} oninput={(e) => handlePercentInput('carbs', 'max', e)} />
			</div>
		</div>
		<div class="space-y-2">
			<Label for="fat-percent-min">Grasas (%)</Label>
			<div class="flex gap-2">
				<Input id="fat-percent-min" type="number" placeholder="Min" class="hide-arrows" value={percentFilters.fat.min ?? ''} oninput={(e) => handlePercentInput('fat', 'min', e)} />
				<Input id="fat-percent-max" type="number" placeholder="Max" class="hide-arrows" value={percentFilters.fat.max ?? ''} oninput={(e) => handlePercentInput('fat', 'max', e)} />
			</div>
		</div>
	</div>
</div>
<style>
	:global(.hide-arrows::-webkit-inner-spin-button),
	:global(.hide-arrows::-webkit-outer-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}
	:global(.hide-arrows) {
		-moz-appearance: textfield;
		appearance: textfield;
	}
</style>

<!--
// Fichero: src/lib/components/recipes/MacroFilters.svelte
// --- VERSIÓN FINAL CON ACTUALIZACIONES INMUTABLES ---
-->
<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
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
	export type FilterUnit = 'grams' | 'percent';

	// --- Props (Svelte 5) ---
	let {
		unit = $bindable(),
		gramFilters = $bindable(),
		percentFilters = $bindable()
	}: {
		unit: FilterUnit;
		gramFilters: GramFilters;
		percentFilters: PercentFilters;
	} = $props();

	function clearFilters() {
		gramFilters = { calories: {}, protein: {}, carbs: {}, fat: {} };
		percentFilters = { protein: {}, carbs: {}, fat: {} };
		unit = 'grams';
	}

	// Justificación: Se sigue un patrón de actualización inmutable. En lugar de mutar
	// el objeto de filtros, se crea una copia nueva con el valor actualizado.
	// Esto garantiza que Svelte 5 detecte el cambio y lo propague al componente padre.
	function handleGramsInput(macro: keyof GramFilters, key: 'min' | 'max', e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const value = target.valueAsNumber;
		gramFilters = {
			...gramFilters,
			[macro]: {
				...gramFilters[macro],
				[key]: isNaN(value) ? undefined : value
			}
		};
	}

	function handlePercentInput(macro: keyof PercentFilters, key: 'min' | 'max', e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const value = target.valueAsNumber;
		percentFilters = {
			...percentFilters,
			[macro]: {
				...percentFilters[macro],
				[key]: isNaN(value) ? undefined : value
			}
		};
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold">Macronutrientes</h3>
		<Button onclick={clearFilters} variant="ghost" size="icon" aria-label="Limpiar filtros de macros">
			<Trash2 class="h-4 w-4" />
		</Button>
	</div>

	<div class="flex items-center space-x-2">
		<Label for="unit-switch" class={unit === 'grams' ? 'font-bold' : ''}>Gramos</Label>
		<Switch
			id="unit-switch"
			checked={unit === 'percent'}
			onCheckedChange={(checked) => {
				unit = checked ? 'percent' : 'grams';
			}}
		/>
		<Label for="unit-switch" class={unit === 'percent' ? 'font-bold' : ''}>Porcentaje (%)</Label>
	</div>

	<!-- Filtros de Gramos y Calorías -->
	<div class="space-y-4 border-l-2 border-transparent pl-2 {unit === 'percent' ? 'opacity-50 grayscale' : 'border-primary'} transition-all">
		<div class="space-y-2">
			<Label for="calories-min">Calorías (kcal)</Label>
			<div class="flex gap-2">
				<Input id="calories-min" type="number" placeholder="Min" value={gramFilters.calories.min ?? ''} oninput={(e) => handleGramsInput('calories', 'min', e)} />
				<Input id="calories-max" type="number" placeholder="Max" value={gramFilters.calories.max ?? ''} oninput={(e) => handleGramsInput('calories', 'max', e)} />
			</div>
		</div>
		<div class="space-y-2">
			<Label for="protein-grams-min">Proteínas (g)</Label>
			<div class="flex gap-2">
				<Input id="protein-grams-min" type="number" placeholder="Min" value={gramFilters.protein.min ?? ''} oninput={(e) => handleGramsInput('protein', 'min', e)} />
				<Input id="protein-grams-max" type="number" placeholder="Max" value={gramFilters.protein.max ?? ''} oninput={(e) => handleGramsInput('protein', 'max', e)} />
			</div>
		</div>
		<div class="space-y-2">
			<Label for="carbs-grams-min">Carbohidratos (g)</Label>
			<div class="flex gap-2">
				<Input id="carbs-grams-min" type="number" placeholder="Min" value={gramFilters.carbs.min ?? ''} oninput={(e) => handleGramsInput('carbs', 'min', e)} />
				<Input id="carbs-grams-max" type="number" placeholder="Max" value={gramFilters.carbs.max ?? ''} oninput={(e) => handleGramsInput('carbs', 'max', e)} />
			</div>
		</div>
		<div class="space-y-2">
			<Label for="fat-grams-min">Grasas (g)</Label>
			<div class="flex gap-2">
				<Input id="fat-grams-min" type="number" placeholder="Min" value={gramFilters.fat.min ?? ''} oninput={(e) => handleGramsInput('fat', 'min', e)} />
				<Input id="fat-grams-max" type="number" placeholder="Max" value={gramFilters.fat.max ?? ''} oninput={(e) => handleGramsInput('fat', 'max', e)} />
			</div>
		</div>
	</div>

	<!-- Filtros de Porcentaje -->
	<div class="space-y-4 border-l-2 border-transparent pl-2 {unit === 'grams' ? 'opacity-50 grayscale' : 'border-primary'} transition-all">
		<div class="space-y-2">
			<Label for="protein-percent-min">Proteínas (%)</Label>
			<div class="flex gap-2">
				<Input id="protein-percent-min" type="number" placeholder="Min" value={percentFilters.protein.min ?? ''} oninput={(e) => handlePercentInput('protein', 'min', e)} />
				<Input id="protein-percent-max" type="number" placeholder="Max" value={percentFilters.protein.max ?? ''} oninput={(e) => handlePercentInput('protein', 'max', e)} />
			</div>
		</div>
		<div class="space-y-2">
			<Label for="carbs-percent-min">Carbohidratos (%)</Label>
			<div class="flex gap-2">
				<Input id="carbs-percent-min" type="number" placeholder="Min" value={percentFilters.carbs.min ?? ''} oninput={(e) => handlePercentInput('carbs', 'min', e)} />
				<Input id="carbs-percent-max" type="number" placeholder="Max" value={percentFilters.carbs.max ?? ''} oninput={(e) => handlePercentInput('carbs', 'max', e)} />
			</div>
		</div>
		<div class="space-y-2">
			<Label for="fat-percent-min">Grasas (%)</Label>
			<div class="flex gap-2">
				<Input id="fat-percent-min" type="number" placeholder="Min" value={percentFilters.fat.min ?? ''} oninput={(e) => handlePercentInput('fat', 'min', e)} />
				<Input id="fat-percent-max" type="number" placeholder="Max" value={percentFilters.fat.max ?? ''} oninput={(e) => handlePercentInput('fat', 'max', e)} />
			</div>
		</div>
	</div>
</div>
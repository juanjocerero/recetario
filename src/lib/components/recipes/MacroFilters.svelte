<!--
// Fichero: src/lib/components/recipes/MacroFilters.svelte
// Componente para los filtros de macronutrientes en la búsqueda avanzada.
-->
<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Trash2 from 'lucide-svelte/icons/trash-2';

	// --- Tipos ---
	export type MacroFilterValues = {
		unit: 'grams' | 'percent';
		calories: { min?: number; max?: number };
		protein: { min?: number; max?: number };
		carbs: { min?: number; max?: number };
		fat: { min?: number; max?: number };
	};

	// --- Props (Svelte 5) ---
	// Justificación: Se usa `bind:value` para una comunicación bidireccional
	// del estado de los filtros con la página padre, siguiendo el patrón de Svelte 5.
	let { value = $bindable() }: { value: MacroFilterValues } = $props();

	function clearFilters() {
		value = {
			unit: 'grams',
			calories: {},
			protein: {},
			carbs: {},
			fat: {}
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
		<Label for="unit-switch">Gramos</Label>
		<Switch
			id="unit-switch"
			checked={value.unit === 'percent'}
			onCheckedChange={(checked) => {
				value.unit = checked ? 'percent' : 'grams';
			}}
		/>
		<Label for="unit-switch">Porcentaje (%)</Label>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<!-- Calorías -->
		<div class="space-y-2">
			<Label for="calories-min">Calorías (kcal)</Label>
			<div class="flex gap-2">
				<Input id="calories-min" type="number" placeholder="Min" bind:value={value.calories.min} />
				<Input id="calories-max" type="number" placeholder="Max" bind:value={value.calories.max} />
			</div>
		</div>

		<!-- Proteínas -->
		<div class="space-y-2">
			<Label for="protein-min">Proteínas ({value.unit === 'grams' ? 'g' : '%'})</Label>
			<div class="flex gap-2">
				<Input id="protein-min" type="number" placeholder="Min" bind:value={value.protein.min} />
				<Input id="protein-max" type="number" placeholder="Max" bind:value={value.protein.max} />
			</div>
		</div>

		<!-- Carbohidratos -->
		<div class="space-y-2">
			<Label for="carbs-min">Carbohidratos ({value.unit === 'grams' ? 'g' : '%'})</Label>
			<div class="flex gap-2">
				<Input id="carbs-min" type="number" placeholder="Min" bind:value={value.carbs.min} />
				<Input id="carbs-max" type="number" placeholder="Max" bind:value={value.carbs.max} />
			</div>
		</div>

		<!-- Grasas -->
		<div class="space-y-2">
			<Label for="fat-min">Grasas ({value.unit === 'grams' ? 'g' : '%'})</Label>
			<div class="flex gap-2">
				<Input id="fat-min" type="number" placeholder="Min" bind:value={value.fat.min} />
				<Input id="fat-max" type="number" placeholder="Max" bind:value={value.fat.max} />
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import ArrowUp from 'lucide-svelte/icons/arrow-up';
	import ArrowDown from 'lucide-svelte/icons/arrow-down';

	export type SortField = 'normalizedName' | 'calories' | 'protein' | 'fat' | 'carbs';
	export type SortDirection = 'asc' | 'desc';

	let { field = $bindable(), direction = $bindable() } = $props<{
		field: SortField;
		direction: SortDirection;
	}>();

	const sortOptions: { value: SortField; label: string }[] = [
		{ value: 'normalizedName', label: 'Nombre' },
		{ value: 'calories', label: 'Calorías' },
		{ value: 'protein', label: 'Proteínas' },
		{ value: 'fat', label: 'Grasas' },
		{ value: 'carbs', label: 'Carbohidratos' }
	];

	const triggerContent = $derived(
		sortOptions.find((opt) => opt.value === field)?.label ?? 'Seleccionar...'
	);
</script>

<div class="flex w-full items-center gap-2">
	<Select.Root
		type="single"
		value={field}
		onValueChange={(value: string | undefined) => {
			if (value) {
				field = value as SortField;
			}
		}}
	>
		<Select.Trigger class="flex-grow">
			{triggerContent}
		</Select.Trigger>
		<Select.Content>
			{#each sortOptions as option (option.value)}
				<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	<Button
		variant={direction === 'asc' ? 'secondary' : 'ghost'}
		size="icon"
		onclick={() => (direction = 'asc')}
		aria-label="Orden ascendente"
	>
		<ArrowUp class="h-4 w-4" />
	</Button>
	<Button
		variant={direction === 'desc' ? 'secondary' : 'ghost'}
		size="icon"
		onclick={() => (direction = 'desc')}
		aria-label="Orden descendente"
	>
		<ArrowDown class="h-4 w-4" />
	</Button>
</div>

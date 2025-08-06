<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import ArrowUp from 'lucide-svelte/icons/arrow-up';
	import ArrowDown from 'lucide-svelte/icons/arrow-down';

	export type SortField = 
		| 'title' 
		| 'calories' 
		| 'protein_grams' 
		| 'fat_grams' 
		| 'carbs_grams' 
		| 'protein_percent' 
		| 'fat_percent' 
		| 'carbs_percent';

	export type SortDirection = 'asc' | 'desc';

	let {
		field = 'title',
		direction = 'asc',
		onFieldChange,
		onDirectionChange
	}: {
		field: SortField;
		direction: SortDirection;
		onFieldChange: (value: SortField) => void;
		onDirectionChange: (value: SortDirection) => void;
	} = $props();

	const sortOptions: { value: SortField; label: string }[] = [
		{ value: 'title', label: 'Nombre' },
		{ value: 'calories', label: 'Calorías' },
		{ value: 'protein_grams', label: 'Proteínas (g)' },
		{ value: 'fat_grams', label: 'Grasas (g)' },
		{ value: 'carbs_grams', label: 'Carbohidratos (g)' },
		{ value: 'protein_percent', label: 'Proteínas (%)' },
		{ value: 'fat_percent', label: 'Grasas (%)' },
		{ value: 'carbs_percent', label: 'Carbohidratos (%)' }
	];

	const triggerContent = $derived(
		sortOptions.find((opt) => opt.value === field)?.label ?? 'Seleccionar...'
	);

</script>

<div class="space-y-2">
    <label for="sort-by" class="text-sm font-medium">Ordenar por</label>
    <div class="flex items-center gap-2">
        <Select.Root 
            type="single"
            value={field}
            onValueChange={(value: string | undefined) => {
                if (value) {
                    onFieldChange(value as SortField);
                }
            }}
        >
            <Select.Trigger id="sort-by" class="flex-grow">
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
            onclick={() => onDirectionChange('asc')}
            aria-label="Orden ascendente"
        >
            <ArrowUp class="h-4 w-4" />
        </Button>
        <Button 
            variant={direction === 'desc' ? 'secondary' : 'ghost'} 
            size="icon" 
            onclick={() => onDirectionChange('desc')}
            aria-label="Orden descendente"
        >
            <ArrowDown class="h-4 w-4" />
        </Button>
    </div>
</div>

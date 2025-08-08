<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { PageData } from '../../../routes/admin/ingredients/$types';
	import { Search, ChevronDown, X } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import IngredientActions from '$lib/components/admin/IngredientActions.svelte';

	let {
		data,
		searchTerm = $bindable(),
		sort,
		editingProductName = $bindable(),
		editingProductId = $bindable(),
		handleUpdateProductName
	} = $props<{
		data: PageData;
		searchTerm: string;
		sort: (column: string) => void;
		editingProductName: string;
		editingProductId: string | null;
		handleUpdateProductName: () => Promise<void>;
	}>();

	// Estado local para las filas expandidas
	let expandedRows = $state<{ [key: string]: boolean }>({});
	function toggleRow(id: string) {
		expandedRows[id] = !expandedRows[id];
	}
</script>

<div class="block md:hidden">
	<div class="mb-4 flex items-center justify-between gap-2">
		<div class="relative flex-grow">
			<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
			<Input class="pl-8 pr-8" placeholder="Buscar..." bind:value={searchTerm} />
			{#if searchTerm}
				<button
					onclick={() => (searchTerm = '')}
					class="absolute right-2.5 top-2.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted"
					aria-label="Limpiar búsqueda"
				>
					<X class="h-4 w-4" />
				</button>
			{/if}
		</div>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}
				>Ordenar <ChevronDown class="ml-2 h-4 w-4" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Label>Ordenar por</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item onclick={() => sort('name')}>Nombre</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => sort('source')}>Origen</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => sort('calories')}>Calorías</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => sort('protein')}>Proteínas</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => sort('fat')}>Grasas</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => sort('carbs')}>Carbs</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<div class="space-y-4">
		{#each data.ingredients as ingredient (ingredient.id)}
			<div class="rounded-lg border">
				<div class="flex w-full items-center p-4">
					<button
						type="button"
						class="flex flex-grow items-center text-left"
						onclick={() => toggleRow(ingredient.id)}
						aria-expanded={expandedRows[ingredient.id] ?? false}
						aria-controls="details-{ingredient.id}"
					>
						<span class="font-medium">{ingredient.name}</span>
						<ChevronDown
							class="ml-2 h-4 w-4 shrink-0 transition-transform duration-200 {expandedRows[
								ingredient.id
							]
								? 'rotate-180'
								: ''}"
						/>
					</button>
					<IngredientActions
						bind:editingProductName
						bind:editingProductId
						{ingredient}
					/>
				</div>
				{#if expandedRows[ingredient.id]}
					<div class="p-4 pt-0" id="details-{ingredient.id}">
						<div class="border-t pt-4">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Origen:</span>
								<span>{ingredient.source === 'custom' ? 'Personalizado' : 'Caché de OFF'}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Calorías:</span>
								<span>{ingredient.calories?.toFixed(1) ?? 'N/A'}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Proteínas:</span>
								<span>{ingredient.protein?.toFixed(1) ?? 'N/A'}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Grasas:</span>
								<span>{ingredient.fat?.toFixed(1) ?? 'N/A'}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Carbs:</span>
								<span>{ingredient.carbs?.toFixed(1) ?? 'N/A'}</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<p class="text-center text-muted-foreground">No hay productos.</p>
		{/each}
	</div>
</div>

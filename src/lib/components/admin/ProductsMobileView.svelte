<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import type { PageData } from '../../../routes/admin/products/$types';
	import { Search, X, Plus, UtensilsCrossed } from 'lucide-svelte';
	import ProductActions from '$lib/components/admin/ProductActions.svelte';
	import MacroBar from '$lib/components/shared/MacroBar.svelte';
	import { Button } from '$lib/components/ui/button';
	import AddCustomProductDialog from '$lib/components/shared/AddCustomProductDialog.svelte';
	import ProductSortOptions, {
		type SortDirection,
		type SortField
	} from '$lib/components/admin/ProductSortOptions.svelte';

	let {
		data,
		form = $bindable(),
		searchTerm = $bindable(),
		sort = $bindable(),
		direction = $bindable(),
		editingProductName = $bindable(),
		editingProductId = $bindable()
	} = $props<{
		data: PageData;
		form: any;
		searchTerm: string;
		sort: SortField;
		direction: SortDirection;
		editingProductName: string;
		editingProductId: string | null;
	}>();

	let isAddDialogOpen = $state(false);
</script>

<div class="block md:hidden mt-16">
	<div class="mb-4 flex gap-2">
		<Button variant="outline" size="sm" href="/admin/products/off" class="flex-1">
			<UtensilsCrossed class="mr-2 h-4 w-4" />
			Buscar en OFF
		</Button>
		<Button onclick={() => (isAddDialogOpen = true)} size="sm" class="flex-1">
			<Plus class="mr-2 h-4 w-4" />
			Añadir
		</Button>
	</div>

	<div class="mb-4 space-y-4">
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
		<ProductSortOptions bind:field={sort} bind:direction={direction} />
	</div>

	<div class="space-y-4">
		{#each data.products as product, i (i)}
			<div class="flex flex-col space-y-3 rounded-lg border bg-card p-4">
				<div class="flex items-baseline justify-between">
					<span class="break-words pr-2 font-medium">{product.name}</span>
					<span class="whitespace-nowrap text-sm text-muted-foreground">
						{product.calories?.toFixed(0)} kcal
					</span>
				</div>

				<MacroBar protein={product.protein} carbs={product.carbs} fat={product.fat} />

				<div class="flex">
					<ProductActions bind:editingProductName bind:editingProductId {product} mode="buttons" />
				</div>
			</div>
		{:else}
			<p class="text-center text-muted-foreground">No hay productos.</p>
		{/each}
	</div>
	<AddCustomProductDialog bind:open={isAddDialogOpen} bind:form />
</div>

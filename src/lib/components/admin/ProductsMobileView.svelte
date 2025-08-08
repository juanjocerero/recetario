<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import type { PageData } from '../../../routes/admin/products/$types';
	import { Search, X } from 'lucide-svelte';
	import ProductActions from '$lib/components/admin/ProductActions.svelte';
	import MacroBar from '$lib/components/shared/MacroBar.svelte';

	let {
		data,
		searchTerm = $bindable(),
		editingProductName = $bindable(),
		editingProductId = $bindable()
	} = $props<{
		data: PageData;
		searchTerm: string;
		editingProductName: string;
		editingProductId: string | null;
	}>();
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
	</div>

	<div class="space-y-4">
		{#each data.products as product (product.id)}
			<div class="flex flex-col space-y-3 rounded-lg border p-4">
				<div class="flex items-baseline justify-between">
					<span class="break-words pr-2 font-medium">{product.name}</span>
					<span class="whitespace-nowrap text-sm text-muted-foreground">
						{product.calories?.toFixed(0)} kcal
					</span>
				</div>

				<MacroBar protein={product.protein} carbs={product.carbs} fat={product.fat} />

				<div class="flex justify-end">
					<ProductActions bind:editingProductName bind:editingProductId {product} />
				</div>
			</div>
		{:else}
			<p class="text-center text-muted-foreground">No hay productos.</p>
		{/each}
	</div>
</div>

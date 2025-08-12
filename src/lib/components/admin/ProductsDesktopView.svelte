<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Separator from '$lib/components/ui/separator';
	import * as Table from '$lib/components/ui/table';
	import type { PageData } from '../../../routes/admin/products/$types';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { Plus, Search, X, UtensilsCrossed } from 'lucide-svelte';
	import SortableHeader from '$lib/components/admin/SortableHeader.svelte';
	import ProductActions from '$lib/components/admin/ProductActions.svelte';
	import MacroBar from '$lib/components/shared/MacroBar.svelte';
	import AddCustomProductDialog from '$lib/components/shared/AddCustomProductDialog.svelte';
	
	let {
		data,
		form = $bindable(),
		searchTerm = $bindable(),
		editingProductId = $bindable(),
		editingProductName = $bindable()
	} = $props<{
		data: PageData;
		form: any;
		searchTerm: string;
		editingProductId: string | null;
		editingProductName: string;
	}>();
	
	// --- Lógica para el diálogo de añadir producto ---
	let isAddDialogOpen = $state(false);
</script>

<div class="hidden md:block">
	<Card>
		<CardHeader>
			<div class="flex flex-row items-center justify-between gap-4 pt-4">
				<div class="flex flex-1 items-center justify-end gap-2">
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
				<a href="/admin/products/off" class={buttonVariants({ variant: 'outline' })}>
					<UtensilsCrossed class="h-4 w-4" />
				</a>
				<Button onclick={() => (isAddDialogOpen = true)}>
					<Plus class="h-4 w-4" />
				</Button>
				<AddCustomProductDialog bind:open={isAddDialogOpen} bind:form />
			</div>
		</div>
	</CardHeader>
	<CardContent>
		<Table.Root class="w-full table-fixed">
			<Table.Header>
				<Table.Row>
					<SortableHeader column="name" label="Nombre" class="w-[30%]" />
					<SortableHeader column="calories" label="kcal" class="w-[12%] justify-end" />
					<Table.Head class="w-[46%]"></Table.Head>
					<Table.Head class="w-[12%] text-right"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.products as product, i (product.id)}
				<Table.Row>
					<Table.Cell class="break-words font-medium whitespace-normal">{product.name}</Table.Cell>
					<Table.Cell class="text-right">{product.calories?.toFixed(0) ?? 'N/A'}</Table.Cell>
					<Table.Cell class="px-6">
						<MacroBar
						protein={product.protein}
						carbs={product.carbs}
						fat={product.fat}
						/>
					</Table.Cell>
					<Table.Cell class="text-right">
						<ProductActions {product} bind:editingProductId bind:editingProductName />
					</Table.Cell>
				</Table.Row>
				{#if i < data.products.length - 1}
				<tr class="border-none !bg-transparent hover:!bg-transparent"
				><td class="p-0" colspan="4"><Separator.Root /></td></tr
				>
				{/if}
				{:else}
				<Table.Row>
					<Table.Cell colspan={4} class="text-center">No hay productos.</Table.Cell>
				</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</CardContent>
</Card>
</div>



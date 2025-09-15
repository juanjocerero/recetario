<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Separator from '$lib/components/ui/separator';
	import * as Table from '$lib/components/ui/table';
	import type { PageData } from '../../../routes/admin/products/$types';
	import { page } from '$app/stores';
	import { Card, CardContent, CardFooter, CardHeader } from '$lib/components/ui/card';
	import { Plus, Search, X, UtensilsCrossed } from 'lucide-svelte';
	import ProductActions from '$lib/components/admin/ProductActions.svelte';
	import MacroBar from '$lib/components/shared/MacroBar.svelte';
	import Pagination from '$lib/components/shared/Pagination.svelte';
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
		editingProductId = $bindable(),
		editingProductName = $bindable()
	} = $props<{
		data: PageData;
		form: any;
		searchTerm: string;
		sort: SortField;
		direction: SortDirection;
		editingProductId: string | null;
		editingProductName: string;
	}>();

	// --- Lógica para el diálogo de añadir producto ---
	let isAddDialogOpen = $state(false);
</script>

<div class="hidden md:block">
	<Card>
		<CardHeader class="pt-4">
			<div class="flex flex-row items-center gap-4">
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

				<div class="w-80">
					<ProductSortOptions bind:field={sort} bind:direction={direction} />
				</div>

				<div class="flex items-center gap-2">
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
						<Table.Head class="w-[30%]">Nombre</Table.Head>
						<Table.Head class="w-[12%] text-right">kcal</Table.Head>
						<Table.Head class="w-[46%]">Macros</Table.Head>
						<Table.Head class="w-[12%] text-right">Acciones</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.products as product, i (i)}
						<Table.Row>
							<Table.Cell class="break-words font-medium whitespace-normal"
								>{product.name}</Table.Cell
							>
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
		{#if data.totalPages > 1}
			<CardFooter>
				<Pagination page={data.page} totalPages={data.totalPages} url={$page.url} />
			</CardFooter>
		{/if}
	</Card>
</div>



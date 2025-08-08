<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import * as Separator from '$lib/components/ui/separator';
	import * as Table from '$lib/components/ui/table';
	import type { PageData } from '../../../routes/admin/products/$types';
	import { invalidateAll } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Plus, Search, X, UtensilsCrossed } from 'lucide-svelte';
	import SortableHeader from '$lib/components/admin/SortableHeader.svelte';
	import ProductActions from '$lib/components/admin/ProductActions.svelte';
	import { Label } from '$lib/components/ui/label';
	import { enhance, applyAction } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let {
		data,
		form,
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
	let name = $state(form?.data?.name ?? '');
	let calories = $state(form?.data?.calories ?? '');
	let protein = $state(form?.data?.protein ?? '');
	let fat = $state(form?.data?.fat ?? '');
	let carbs = $state(form?.data?.carbs ?? '');

	$effect(() => {
		if (form?.data) {
			name = form.data.name ?? '';
			calories = form.data.calories ?? '';
			protein = form.data.protein ?? '';
			fat = form.data.fat ?? '';
			carbs = form.data.carbs ?? '';
		}
	});
</script>

<div class="hidden md:block">
	<Card>
		<CardHeader>
			<div class="flex flex-row items-center justify-between gap-4 pt-4">
				<CardTitle>Gestión de Productos</CardTitle>
				<div class="flex flex-1 items-center justify-end gap-2">
					<div class="relative flex-grow">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input class="pl-8 pr-8" placeholder="Buscar por nombre..." bind:value={searchTerm} />
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
						<UtensilsCrossed class="mr-2 h-4 w-4" />
						Añadir desde OpenFoodFacts
					</a>
					<Dialog.Root bind:open={isAddDialogOpen}>
						<Button onclick={() => (isAddDialogOpen = true)}>
							<Plus class="mr-2 h-4 w-4" /> Añadir Producto
						</Button>
						<Dialog.Content class="sm:max-w-[425px]">
							<Dialog.Header>
								<Dialog.Title>Añadir Nuevo Producto</Dialog.Title>
								<Dialog.Description>
									Añade un nuevo producto con sus macros por 100g.
								</Dialog.Description>
							</Dialog.Header>
							<form
								method="POST"
								action="?/addCustom"
								use:enhance={() => {
									const toastId = toast.loading('Añadiendo producto...');
									return async ({ result }) => {
										await applyAction(result);
										if (result.type === 'success') {
											toast.success('Producto añadido con éxito.', { id: toastId });
											isAddDialogOpen = false;
											await invalidateAll();
										} else if (result.type === 'failure') {
											toast.error('Error al añadir el producto.', { id: toastId });
										} else {
											toast.dismiss(toastId);
										}
									};
								}}
							>
								<div class="grid gap-4 py-4">
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="name" class="text-right">Nombre</Label>
										<Input id="name" name="name" class="col-span-3" required bind:value={name} />
									</div>
									{#if form?.errors?.name}
										<p class="col-span-3 col-start-2 text-sm text-red-500">
											{form.errors.name[0]}
										</p>
									{/if}
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="calories" class="text-right">Calorías</Label>
										<Input
											id="calories"
											name="calories"
											type="number"
											step="0.01"
											class="col-span-3 hide-arrows"
											required
											bind:value={calories}
										/>
									</div>
									{#if form?.errors?.calories}
										<p class="col-span-3 col-start-2 text-sm text-red-500">
											{form.errors.calories[0]}
										</p>
									{/if}
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="protein" class="text-right">Proteínas</Label>
										<Input
											id="protein"
											name="protein"
											type="number"
											step="0.01"
											class="col-span-3 hide-arrows"
											required
											bind:value={protein}
										/>
									</div>
									{#if form?.errors?.protein}
										<p class="col-span-3 col-start-2 text-sm text-red-500">
											{form.errors.protein[0]}
										</p>
									{/if}
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="fat" class="text-right">Grasas</Label>
										<Input
											id="fat"
											name="fat"
											type="number"
											step="0.01"
											class="col-span-3 hide-arrows"
											required
											bind:value={fat}
										/>
									</div>
									{#if form?.errors?.fat}
										<p class="col-span-3 col-start-2 text-sm text-red-500">
											{form.errors.fat[0]}
										</p>
									{/if}
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="carbs" class="text-right">Carbohidratos</Label>
										<Input
											id="carbs"
											name="carbs"
											type="number"
											step="0.01"
											class="col-span-3 hide-arrows"
											required
											bind:value={carbs}
										/>
									</div>
									{#if form?.errors?.carbs}
										<p class="col-span-3 col-start-2 text-sm text-red-500">
											{form.errors.carbs[0]}
										</p>
									{/if}
								</div>
								<Dialog.Footer>
									<Dialog.Close
										class={buttonVariants({ variant: 'outline' })}
										onclick={() => (isAddDialogOpen = false)}>Cancelar</Dialog.Close
									>
									<Button type="submit">Guardar</Button>
								</Dialog.Footer>
							</form>
						</Dialog.Content>
					</Dialog.Root>
				</div>
			</div>
		</CardHeader>
		<CardContent>
			<Table.Root class="w-full table-fixed">
				<Table.Header>
					<Table.Row>
						<SortableHeader column="name" label="Nombre" class="w-[40%]" />
						<SortableHeader column="calories" label="Calorías" class="w-[12%] justify-end" />
						<SortableHeader column="protein" label="Proteínas" class="w-[12%] justify-end" />
						<SortableHeader column="fat" label="Grasas" class="w-[12%] justify-end" />
						<SortableHeader column="carbs" label="Carbs" class="w-[12%] justify-end" />
						<Table.Head class="w-[12%] text-right">Acciones</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.products as product, i (product.id)}
						<Table.Row>
							<Table.Cell class="break-words font-medium">{product.name}</Table.Cell>
							<Table.Cell class="text-right">{product.calories?.toFixed(2) ?? 'N/A'}</Table.Cell>
							<Table.Cell class="text-right">{product.protein?.toFixed(2) ?? 'N/A'}</Table.Cell>
							<Table.Cell class="text-right">{product.fat?.toFixed(2) ?? 'N/A'}</Table.Cell>
							<Table.Cell class="text-right">{product.carbs?.toFixed(2) ?? 'N/A'}</Table.Cell>
							<Table.Cell class="text-right">
								<ProductActions {product} bind:editingProductId bind:editingProductName />
							</Table.Cell>
						</Table.Row>
						{#if i < data.products.length - 1}
							<tr class="border-none !bg-transparent hover:!bg-transparent"
								><td class="p-0" colspan="6"><Separator.Root /></td></tr
							>
						{/if}
					{:else}
						<Table.Row>
							<Table.Cell colspan={6} class="text-center">No hay productos.</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</CardContent>
	</Card>
</div>



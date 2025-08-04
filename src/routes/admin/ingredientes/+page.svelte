<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Separator from '$lib/components/ui/separator';
	import * as Table from '$lib/components/ui/table';
	import type { ActionData, PageData } from './$types';
	import SyncDialog from '$lib/components/admin/SyncDialog.svelte';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { RefreshCw, Download, Plus, LayoutDashboard } from 'lucide-svelte';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	// --- Lógica para el diálogo de sincronización ---
	let isSyncDialogOpen = $state(false);
	let syncState = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let syncResult = $state<any>(null);

	async function handleSync() {
		syncState = 'loading';
		try {
			const response = await fetch('/api/ingredients/sync', {
				method: 'POST',
				credentials: 'include'
			});
			if (!response.ok) throw new Error('Falló la petición de sincronización');
			syncResult = await response.json();
			syncState = 'success';
			await invalidateAll();
		} catch (error) {
			console.error('Error durante la sincronización:', error);
			syncState = 'error';
		}
	}

	// --- Lógica para el diálogo de añadir ingrediente personalizado ---
	let isAddCustomDialogOpen = $state(false);

	// --- Lógica para editar el nombre de un producto de OFF ---
	let editingProductName = $state('');
	let isProductEditDialogOpen = $state(false);

	async function handleUpdateProductName(id: string) {
		try {
			const productId = id.startsWith('product-') ? id.substring(8) : id;
			const encodedProductId = encodeURIComponent(productId);

			const response = await fetch(`/api/products/${encodedProductId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: editingProductName })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || 'Error al actualizar el nombre');
			}

			toast.success('Nombre del producto actualizado con éxito.');
			await invalidateAll();
			isProductEditDialogOpen = false;
		} catch (error) {
			console.error('Error al actualizar el nombre del producto:', error);
			const message = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
			toast.error(message);
		}
	}
</script>

<div class="container mx-auto py-10">
	<Card>
		<CardHeader>
			<div class="flex pt-4 flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<CardTitle>Gestión de Ingredientes</CardTitle>
				<div class="flex flex-wrap gap-2">
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								href="/"
								variant="outline"
								size="icon"
								class="h-9 w-9"
								aria-label="Inicio"
							>
								<LayoutDashboard class="h-4 w-4" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Inicio</p>
						</Tooltip.Content>
					</Tooltip.Root>

					<Tooltip.Root>
						<Tooltip.Trigger
							class={buttonVariants({ variant: 'outline', size: 'icon' })}
							onclick={() => invalidateAll()}
						>
							<RefreshCw class="h-4 w-4" />
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Refrescar datos</p>
						</Tooltip.Content>
					</Tooltip.Root>

					<Dialog.Root bind:open={isSyncDialogOpen}>
						<Tooltip.Root>
							<Tooltip.Trigger
								class={buttonVariants({ variant: 'outline', size: 'icon' })}
								onclick={() => {
									isSyncDialogOpen = true;
									handleSync();
								}}
							>
								<Download class="h-4 w-4" />
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Sincronizar con OFF</p>
							</Tooltip.Content>
						</Tooltip.Root>
						{#if isSyncDialogOpen}
							<SyncDialog state={syncState} result={syncResult} />
						{/if}
					</Dialog.Root>

					<Dialog.Root bind:open={isAddCustomDialogOpen}>
						<Tooltip.Root>
							<Tooltip.Trigger
								class={buttonVariants({ size: 'icon' })}
								onclick={() => (isAddCustomDialogOpen = true)}
							>
								<Plus class="h-4 w-4" />
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Añadir Personalizado</p>
							</Tooltip.Content>
						</Tooltip.Root>
						<Dialog.Content class="sm:max-w-[425px]">
							<Dialog.Header>
								<Dialog.Title>Añadir Nuevo Ingrediente</Dialog.Title>
								<Dialog.Description>
									Completa los detalles del ingrediente personalizado. Todos los valores son por
									100g.
								</Dialog.Description>
							</Dialog.Header>
							<form
								method="POST"
								action="?/create"
								use:enhance={() => {
									isAddCustomDialogOpen = false;
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<div class="grid gap-4 py-4">
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="name" class="text-right">Nombre</Label>
										<Input id="name" name="name" class="col-span-3" />
									</div>
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="calories" class="text-right">Calorías</Label>
										<Input
											id="calories"
											name="calories"
											type="number"
											step="0.1"
											class="col-span-3"
										/>
									</div>
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="protein" class="text-right">Proteínas</Label>
										<Input
											id="protein"
											name="protein"
											type="number"
											step="0.1"
											class="col-span-3"
										/>
									</div>
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="fat" class="text-right">Grasas</Label>
										<Input id="fat" name="fat" type="number" step="0.1" class="col-span-3" />
									</div>
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="carbs" class="text-right">Carbohidratos</Label>
										<Input id="carbs" name="carbs" type="number" step="0.1" class="col-span-3" />
									</div>
								</div>
								<Dialog.Footer>
									<Button type="submit">Guardar</Button>
								</Dialog.Footer>
							</form>
						</Dialog.Content>
					</Dialog.Root>
				</div>
			</div>
		</CardHeader>
		<CardContent>
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header class="hidden md:table-header-group">
						<Table.Row>
							<Table.Head>Nombre</Table.Head>
							<Table.Head>Origen</Table.Head>
							<Table.Head class="text-right">Calorías</Table.Head>
							<Table.Head class="text-right">Proteínas</Table.Head>
							<Table.Head class="text-right">Grasas</Table.Head>
							<Table.Head class="text-right">Carbs</Table.Head>
							<Table.Head class="text-right">Acciones</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.ingredients as ingredient, i (ingredient.id)}
							<Table.Row class="mb-4 block border-b md:table-row md:border-b-0 md:mb-0">
								<Table.Cell
									class="flex items-center justify-between font-medium md:table-cell"
									data-label="Nombre"
								>
									<!-- <span class="font-bold md:hidden pr-2">Nombre:</span> -->
									{ingredient.name}
								</Table.Cell>
								<Table.Cell class="block md:table-cell" data-label="Origen">
									{#if ingredient.source === 'custom'}
										<span
											class="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
										>
											Personalizado
										</span>
									{:else}
										<span
											class="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300"
										>
											Caché de OFF
										</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="block text-right md:table-cell" data-label="Calorías">
									{ingredient.calories?.toFixed(1) ?? 'N/A'}
								</Table.Cell>
								<Table.Cell class="block text-right md:table-cell" data-label="Proteínas">
									{ingredient.protein?.toFixed(1) ?? 'N/A'}
								</Table.Cell>
								<Table.Cell class="block text-right md:table-cell" data-label="Grasas">
									{ingredient.fat?.toFixed(1) ?? 'N/A'}
								</Table.Cell>
								<Table.Cell class="block text-right md:table-cell" data-label="Carbs">
									{ingredient.carbs?.toFixed(1) ?? 'N/A'}
								</Table.Cell>
								<Table.Cell class="block text-right md:table-cell" data-label="Acciones">
									<div class="flex justify-end gap-2">
										{#if ingredient.source === 'custom'}
											<Dialog.Root>
												<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}>
													Editar
												</Dialog.Trigger>
												<Dialog.Content class="sm:max-w-[425px]">
													<Dialog.Header>
														<Dialog.Title>Editar Ingrediente</Dialog.Title>
													</Dialog.Header>
													<form method="POST" action="?/update" use:enhance>
														<input type="hidden" name="id" value={ingredient.id} />
														<div class="grid gap-4 py-4">
															<div class="grid grid-cols-4 items-center gap-4">
																<Label for="name-edit-{ingredient.id}" class="text-right"
																	>Nombre</Label
																>
																<Input
																	id="name-edit-{ingredient.id}"
																	name="name"
																	value={ingredient.name}
																	class="col-span-3"
																/>
															</div>
															<div class="grid grid-cols-4 items-center gap-4">
																<Label for="calories-edit-{ingredient.id}" class="text-right"
																	>Calorías</Label
																>
																<Input
																	id="calories-edit-{ingredient.id}"
																	name="calories"
																	type="number"
																	step="0.1"
																	value={ingredient.calories}
																	class="col-span-3"
																/>
															</div>
															<div class="grid grid-cols-4 items-center gap-4">
																<Label for="protein-edit-{ingredient.id}" class="text-right"
																	>Proteínas</Label
																>
																<Input
																	id="protein-edit-{ingredient.id}"
																	name="protein"
																	type="number"
																	step="0.1"
																	value={ingredient.protein}
																	class="col-span-3"
																/>
															</div>
															<div class="grid grid-cols-4 items-center gap-4">
																<Label for="fat-edit-{ingredient.id}" class="text-right"
																	>Grasas</Label
																>
																<Input
																	id="fat-edit-{ingredient.id}"
																	name="fat"
																	type="number"
																	step="0.1"
																	value={ingredient.fat}
																	class="col-span-3"
																/>
															</div>
															<div class="grid grid-cols-4 items-center gap-4">
																<Label for="carbs-edit-{ingredient.id}" class="text-right"
																	>Carbohidratos</Label
																>
																<Input
																	id="carbs-edit-{ingredient.id}"
																	name="carbs"
																	type="number"
																	step="0.1"
																	value={ingredient.carbs}
																	class="col-span-3"
																/>
															</div>
														</div>
														<Dialog.Footer>
															<Dialog.Close class={buttonVariants()} type="submit"
																>Guardar Cambios</Dialog.Close
															>
														</Dialog.Footer>
													</form>
												</Dialog.Content>
											</Dialog.Root>
										{:else}
											<Dialog.Root bind:open={isProductEditDialogOpen}>
												<Dialog.Trigger
													class={buttonVariants({ variant: 'outline', size: 'sm' })}
													onclick={() => {
														editingProductName = ingredient.name;
														isProductEditDialogOpen = true;
													}}
												>
													Editar
												</Dialog.Trigger>
												<Dialog.Content class="sm:max-w-[425px]">
													<Dialog.Header>
														<Dialog.Title>Editar Nombre del Producto</Dialog.Title>
													</Dialog.Header>
													<div class="grid gap-4 py-4">
														<div class="grid grid-cols-4 items-center gap-4">
															<Label for="name-edit-off-{ingredient.id}" class="text-right"
																>Nombre</Label
															>
															<Input
																id="name-edit-off-{ingredient.id}"
																bind:value={editingProductName}
																class="col-span-3"
															/>
														</div>
													</div>
													<Dialog.Footer>
														<Button onclick={() => handleUpdateProductName(ingredient.id)}>
															Guardar Cambios
														</Button>
													</Dialog.Footer>
												</Dialog.Content>
											</Dialog.Root>
										{/if}

										<Dialog.Root>
											<Dialog.Trigger class={buttonVariants({ variant: 'destructive', size: 'sm' })}>
												Eliminar
											</Dialog.Trigger>
											<Dialog.Content class="sm:max-w-[425px]">
												<Dialog.Header>
													<Dialog.Title>Confirmar Eliminación</Dialog.Title>
													<Dialog.Description>
														¿Estás seguro de que quieres eliminar el ingrediente "{ingredient.name}"?
														Esta acción no se puede deshacer.
													</Dialog.Description>
												</Dialog.Header>
												<form method="POST" action="?/delete" use:enhance>
													<input type="hidden" name="id" value={ingredient.id} />
													<input type="hidden" name="source" value={ingredient.source} />
													<Dialog.Footer>
														<Dialog.Close class={buttonVariants({ variant: 'outline' })}
															>Cancelar</Dialog.Close
														>
														<Button variant="destructive" type="submit">Eliminar</Button>
													</Dialog.Footer>
												</form>
											</Dialog.Content>
										</Dialog.Root>
									</div>
								</Table.Cell>
							</Table.Row>
							{#if i < data.ingredients.length - 1}
								<tr class="border-none !bg-transparent hover:!bg-transparent">
									<td class="p-0" colspan="7">
										<Separator.Root />
									</td>
								</tr>
							{/if}
						{:else}
							<Table.Row>
								<Table.Cell colspan={7} class="text-center">No hay ingredientes.</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</CardContent>
	</Card>
</div>

<style>
	@media (max-width: 767px) {
		:global([data-label])::before {
			content: attr(data-label);
			font-weight: bold;
			margin-right: 0.5rem;
			display: inline-block;
		}
		/* Alinea el contenido de la celda a la derecha del label */
		:global(.md\:table-cell[data-label]) {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0.75rem 1rem;
			border-bottom: 1px solid hsl(var(--border));
		}
		:global(.md\:table-cell[data-label]:last-child) {
			border-bottom: none;
		}
	}
</style>

<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import * as Separator from '$lib/components/ui/separator';
	import * as Table from '$lib/components/ui/table';
	import type { PageData } from '../../../routes/admin/ingredientes/$types';
	import { invalidateAll } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { RefreshCw, Download, Plus, LayoutDashboard, Search, X } from 'lucide-svelte';
	import SortableHeader from '$lib/components/admin/SortableHeader.svelte';
	import IngredientActions from '$lib/components/admin/IngredientActions.svelte';
	import { Label } from '$lib/components/ui/label';
	import { enhance, applyAction } from '$app/forms';
	import { toast } from 'svelte-sonner';

	let {
		data,
		form,
		searchTerm = $bindable(),
		isProductEditDialogOpen = $bindable(),
		editingProductName = $bindable(),
		editingProductId = $bindable(),
		handleUpdateProductName
	} = $props<{
		data: PageData;
		form: any;
		searchTerm: string;
		isProductEditDialogOpen: boolean;
		editingProductName: string;
		editingProductId: string | null;
		handleUpdateProductName: () => Promise<void>;
	}>();

	async function handleSync() {
		const toastId = toast.loading(
			'Iniciando sincronización con Open Food Facts... Esto puede tardar.'
		);
		try {
			const response = await fetch('/api/ingredients/sync', {
				method: 'POST',
				credentials: 'include'
			});
			if (!response.ok) throw new Error('Falló la petición de sincronización');
			toast.success('Sincronización completada con éxito.', { id: toastId });
			await invalidateAll();
		} catch (error) {
			console.error('Error durante la sincronización:', error);
			toast.error('La sincronización falló. Inténtalo de nuevo más tarde.', { id: toastId });
		}
	}

	// --- Lógica para el diálogo de añadir ingrediente personalizado ---
	let isAddCustomDialogOpen = $state(false);
	let name = $state(form?.data?.name ?? '');
	let calories = $state(form?.data?.calories ?? '');
	let protein = $state(form?.data?.protein ?? '');
	let fat = $state(form?.data?.fat ?? '');
	let carbs = $state(form?.data?.carbs ?? '');

	$effect(() => {
		name = form?.data?.name ?? '';
		calories = form?.data?.calories ?? '';
		protein = form?.data?.protein ?? '';
		fat = form?.data?.fat ?? '';
		carbs = form?.data?.carbs ?? '';
	});
</script>

<Tooltip.Provider>
	<div class="hidden md:block">
		<Card>
			<CardHeader>
				<div class="flex flex-row items-center justify-between gap-4 pt-4">
					<CardTitle>Gestión de Ingredientes</CardTitle>
					<div class="flex flex-1 justify-end gap-2">
						<div class="relative w-full max-w-sm">
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
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button href="/" variant="outline" size="icon" class="h-9 w-9" aria-label="Inicio">
									<LayoutDashboard class="h-4 w-4" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content><p>Inicio</p></Tooltip.Content>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger
								class={buttonVariants({ variant: 'outline', size: 'icon' })}
								onclick={() => invalidateAll()}
							>
								<RefreshCw class="h-4 w-4" />
							</Tooltip.Trigger>
							<Tooltip.Content><p>Refrescar datos</p></Tooltip.Content>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger
								class={buttonVariants({ variant: 'outline', size: 'icon' })}
								onclick={handleSync}
							>
								<Download class="h-4 w-4" />
							</Tooltip.Trigger>
							<Tooltip.Content><p>Sincronizar con OFF</p></Tooltip.Content>
						</Tooltip.Root>
						<Dialog.Root bind:open={isAddCustomDialogOpen}>
							<Tooltip.Root>
								<Tooltip.Trigger
									class={buttonVariants({ size: 'icon' })}
									onclick={() => (isAddCustomDialogOpen = true)}
								>
									<Plus class="h-4 w-4" />
								</Tooltip.Trigger>
								<Tooltip.Content><p>Añadir Personalizado</p></Tooltip.Content>
							</Tooltip.Root>
							<Dialog.Content class="sm:max-w-[425px]">
								<Dialog.Header>
									<Dialog.Title>Añadir Ingrediente Personalizado</Dialog.Title>
									<Dialog.Description> Añade un nuevo ingrediente con sus macros. </Dialog.Description>
								</Dialog.Header>
								<form
									method="POST"
									action="?/addCustom"
									use:enhance={() => {
										const toastId = toast.loading('Añadiendo ingrediente...');
										return async ({ result }) => {
											await applyAction(result);
											if (result.type === 'success') {
												toast.success('Ingrediente añadido con éxito.', { id: toastId });
												isAddCustomDialogOpen = false;
												await invalidateAll();
											} else if (result.type === 'failure') {
												toast.error('Error al añadir el ingrediente.', { id: toastId });
												// No cerramos el diálogo para que el usuario pueda corregir
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
												step="0.1"
												class="col-span-3"
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
												step="0.1"
												class="col-span-3"
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
												step="0.1"
												class="col-span-3"
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
												step="0.1"
												class="col-span-3"
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
											onclick={() => (isAddCustomDialogOpen = false)}>Cancelar</Dialog.Close
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
							<SortableHeader column="name" label="Nombre" class="w-[30%]" />
							<SortableHeader column="source" label="Origen" class="w-[15%]" />
							<SortableHeader column="calories" label="Calorías" class="w-[10%] justify-end" />
							<SortableHeader column="protein" label="Proteínas" class="w-[10%] justify-end" />
							<SortableHeader column="fat" label="Grasas" class="w-[10%] justify-end" />
							<SortableHeader column="carbs" label="Carbs" class="w-[10%] justify-end" />
							<Table.Head class="w-[15%] text-right">Acciones</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.ingredients as ingredient, i (ingredient.id)}
							<Table.Row>
								<Table.Cell class="break-words font-medium">{ingredient.name}</Table.Cell>
								<Table.Cell>
									{#if ingredient.source === 'custom'}
										<span
											class="me-2 rounded bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
											>Personalizado</span
										>
									{:else}
										<span
											class="me-2 rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300"
											>Caché de OFF</span
										>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right">{ingredient.calories?.toFixed(1) ?? 'N/A'}</Table.Cell>
								<Table.Cell class="text-right">{ingredient.protein?.toFixed(1) ?? 'N/A'}</Table.Cell>
								<Table.Cell class="text-right">{ingredient.fat?.toFixed(1) ?? 'N/A'}</Table.Cell>
								<Table.Cell class="text-right">{ingredient.carbs?.toFixed(1) ?? 'N/A'}</Table.Cell>
								<Table.Cell class="text-right">
									<IngredientActions
										bind:isProductEditDialogOpen
										bind:editingProductName
										bind:editingProductId
										{ingredient}
										{handleUpdateProductName}
									/>
								</Table.Cell>
							</Table.Row>
							{#if i < data.ingredients.length - 1}
								<tr class="border-none !bg-transparent hover:!bg-transparent"
									><td class="p-0" colspan="7"><Separator.Root /></td></tr
								>
							{/if}
						{:else}
							<Table.Row>
								<Table.Cell colspan={7} class="text-center">No hay ingredientes.</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</CardContent>
		</Card>
	</div>
</Tooltip.Provider>



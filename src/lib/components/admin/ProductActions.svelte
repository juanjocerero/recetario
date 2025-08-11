<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance, applyAction } from '$app/forms';
	import type { Product } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { Pencil, Trash2, Calculator, MoreVertical, Image } from 'lucide-svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import ImageManager from '$lib/components/shared/ImageManager.svelte';

	let {
		product,
		editingProductName = $bindable(),
		editingProductId = $bindable(),
		mode = 'dropdown'
	} = $props<{
		product: Product;
		editingProductName: string;
		editingProductId: string | null;
		mode?: 'dropdown' | 'buttons';
	}>();

	// --- Estado local para los campos del formulario de edición ---
	let calories = $state(product.calories);
	let protein = $state(product.protein);
	let fat = $state(product.fat);
	let carbs = $state(product.carbs);

	// --- Estado para los diálogos ---
	let isDeleteDialogOpen = $state(false);
	let isCalcDialogOpen = $state(false);
	let isEditDialogOpen = $state(false);
	let isImageDialogOpen = $state(false);

	// --- Estado para el diálogo de imagen ---
	let editingImageUrl = $state<string | null>(null);

	// --- Estado para el diálogo de cálculo ---
	let quantity = $state(100);

	const calculatedMacros = $derived(
		((() => {
			const factor = quantity / 100;
			return {
				calories: (product.calories * factor).toFixed(1),
				protein: (product.protein * factor).toFixed(1),
				fat: (product.fat * factor).toFixed(1),
				carbs: (product.carbs * factor).toFixed(1)
			};
		})())
	);

	function openEditDialog() {
		editingProductId = product.id;
		editingProductName = product.name;
		calories = product.calories;
		protein = product.protein;
		fat = product.fat;
		carbs = product.carbs;
		isEditDialogOpen = true;
	}

	function closeEditDialog() {
		editingProductId = null;
		isEditDialogOpen = false;
	}

	$effect(() => {
		if (editingProductId !== product.id) {
			isEditDialogOpen = false;
		}
	});
</script>

{#if mode === 'dropdown'}
	<!-- Menú Desplegable de Acciones -->
	<DropdownMenu>
		<DropdownMenuTrigger
			class={buttonVariants({ variant: 'ghost', size: 'icon' })}
			onclick={(e) => {
				e.stopPropagation();
				e.preventDefault();
			}}
		>
			<MoreVertical class="h-4 w-4" />
			<span class="sr-only">Abrir menú</span>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end" onclick={(e) => e.stopPropagation()}>
			<DropdownMenuItem onclick={() => (isCalcDialogOpen = true)}>
				<Calculator class="mr-2 h-4 w-4" />
				<span>Calcular</span>
			</DropdownMenuItem>
			<DropdownMenuItem onclick={openEditDialog}>
				<Pencil class="mr-2 h-4 w-4" />
				<span>Editar</span>
			</DropdownMenuItem>
			<DropdownMenuItem
				onclick={() => {
					editingImageUrl = product.imageUrl;
					isImageDialogOpen = true;
				}}
			>
				<Image class="mr-2 h-4 w-4" />
				<span>Imagen</span>
			</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenuItem
				onclick={() => (isDeleteDialogOpen = true)}
				class="text-destructive focus:text-destructive"
			>
				<Trash2 class="mr-2 h-4 w-4" />
				<span>Eliminar</span>
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
{:else}
	<div class="flex flex-1 gap-2 pt-2">
		<Button variant="outline" size="sm" class="flex-1" onclick={() => (isCalcDialogOpen = true)}>
			<Calculator class="h-4 w-4" />
		</Button>
		<Button variant="outline" size="sm" class="flex-1" onclick={openEditDialog}>
			<Pencil class="h-4 w-4" />
		</Button>
		<Button
			variant="outline"
			size="sm"
			class="flex-1"
			onclick={() => {
				editingImageUrl = product.imageUrl;
				isImageDialogOpen = true;
			}}
		>
			<Image class="h-4 w-4" />
		</Button>
		<Button
			variant="destructive"
			size="sm"
			class="flex-1"
			onclick={() => (isDeleteDialogOpen = true)}
		>
			<Trash2 class="h-4 w-4" />
		</Button>
	</div>
{/if}

<!-- Diálogo de Calcular -->
<Dialog.Root bind:open={isCalcDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Calcular Nutrientes</Dialog.Title>
			<Dialog.Description
				>Calcula los macros para una cantidad específica de {product.name}.</Dialog.Description
			>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="quantity" class="text-right">Cantidad (g)</Label>
				<Input
					id="quantity"
					type="number"
					bind:value={quantity}
					class="col-span-3 hide-arrows"
				/>
			</div>
			<div class="mt-4 rounded-lg bg-muted/50 p-4">
				<h4 class="mb-2 font-semibold">Nutrientes para {quantity}g:</h4>
				<div class="space-y-1 text-sm">
					<p><strong>Calorías:</strong> {Number(calculatedMacros.calories).toFixed(0)} kcal</p>
					<p><strong>Proteínas:</strong> {calculatedMacros.protein} g</p>
					<p><strong>Grasas:</strong> {calculatedMacros.fat} g</p>
					<p><strong>Carbohidratos:</strong> {calculatedMacros.carbs} g</p>
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Diálogo de Editar -->
<Dialog.Root
	open={isEditDialogOpen}
	onOpenChange={(isOpen) => {
		if (!isOpen) {
			closeEditDialog();
		}
	}}
>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Editar Producto</Dialog.Title>
		</Dialog.Header>
		<form
			method="POST"
			action="?/update"
			use:enhance={() => {
				const toastId = toast.loading('Actualizando producto...');
				return async ({ result }) => {
					await applyAction(result);
					if (result.type === 'success') {
						toast.success('Producto actualizado.', { id: toastId });
						closeEditDialog();
						await invalidateAll();
					} else if (result.type === 'failure') {
						toast.error('Error al actualizar.', { id: toastId });
					} else {
						toast.dismiss(toastId);
					}
				};
			}}
		>
			<input type="hidden" name="id" value={product.id} />
			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="name-edit-{product.id}" class="text-right">Nombre</Label>
					<Input
						id="name-edit-{product.id}"
						name="name"
						bind:value={editingProductName}
						class="col-span-3"
					/>
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="calories-edit-{product.id}" class="text-right">Calorías</Label>
					<Input
						id="calories-edit-{product.id}"
						name="calories"
						type="number"
						step="0.01"
						bind:value={calories}
						class="col-span-3 hide-arrows"
					/>
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="protein-edit-{product.id}" class="text-right">Proteínas</Label>
					<Input
						id="protein-edit-{product.id}"
						name="protein"
						type="number"
						step="0.01"
						bind:value={protein}
						class="col-span-3 hide-arrows"
					/>
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="fat-edit-{product.id}" class="text-right">Grasas</Label>
					<Input
						id="fat-edit-{product.id}"
						name="fat"
						type="number"
						step="0.01"
						bind:value={fat}
						class="col-span-3 hide-arrows"
					/>
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="carbs-edit-{product.id}" class="text-right">Carbohidratos</Label>
					<Input
						id="carbs-edit-{product.id}"
						name="carbs"
						type="number"
						step="0.01"
						bind:value={carbs}
						class="col-span-3 hide-arrows"
					/>
				</div>
			</div>
			<Dialog.Footer>
				<Button type="submit">Guardar Cambios</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Diálogo de Eliminar -->
<Dialog.Root bind:open={isDeleteDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Confirmar Eliminación</Dialog.Title>
			<Dialog.Description>
				¿Estás seguro de que quieres eliminar el producto "{product.name}"? Esta acción no se puede
				deshacer.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/delete"
			use:enhance={({ formElement }) => {
				const toastId = toast.loading('Eliminando producto...');
				return async ({ result }) => {
					await applyAction(result);
					if (result.type === 'success') {
						toast.success('Producto eliminado.', { id: toastId });
						isDeleteDialogOpen = false;
						await invalidateAll();
					} else if (result.type === 'failure') {
						let message = 'Error al eliminar. Puede que esté en uso en una receta.';
						if (result.data && typeof (result.data as any).message === 'string') {
							message = (result.data as any).message;
						}
						toast.error(message, { id: toastId });
					} else {
						toast.dismiss(toastId);
					}
				};
			}}
		>
			<input type="hidden" name="id" value={product.id} />
			<Dialog.Footer>
				<Dialog.Close class={buttonVariants({ variant: 'outline' })}>Cancelar</Dialog.Close>
				<Button variant="destructive" type="submit">Eliminar</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Diálogo de Imagen -->
<Dialog.Root bind:open={isImageDialogOpen}>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Gestionar Imagen</Dialog.Title>
			<Dialog.Description>
				Sube un archivo o pega una URL para asignarla como imagen del producto "{product.name}".
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/updateImage"
			use:enhance={() => {
				const toastId = toast.loading('Actualizando imagen...');
				return async ({ result }) => {
					await applyAction(result);
					if (result.type === 'success') {
						toast.success('Imagen actualizada.', { id: toastId });
						isImageDialogOpen = false;
						await invalidateAll();
					} else if (result.type === 'failure') {
						let message = 'Error al actualizar la imagen.';
						if (result.data && typeof (result.data as any).message === 'string') {
							message = (result.data as any).message;
						}
						toast.error(message, { id: toastId });
					} else {
						toast.dismiss(toastId);
					}
				};
			}}
		>
			<input type="hidden" name="id" value={product.id} />
			<div class="py-4">
				<ImageManager bind:imageUrl={editingImageUrl} />
			</div>
			<Dialog.Footer>
				<Button type="submit">Guardar Imagen</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

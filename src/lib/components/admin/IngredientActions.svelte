<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance, applyAction } from '$app/forms';
	import type { Product } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { Pencil, Trash2, Calculator } from 'lucide-svelte';

	let {
		ingredient,
		editingProductName = $bindable(),
		editingProductId = $bindable()
	} = $props<{
		ingredient: Product;
		editingProductName: string;
		editingProductId: string | null;
	}>();

	// --- Estado local para los campos del formulario de edición ---
	let calories = $state(ingredient.calories);
	let protein = $state(ingredient.protein);
	let fat = $state(ingredient.fat);
	let carbs = $state(ingredient.carbs);

	// --- Estado para el diálogo de borrado ---
	let isDeleteDialogOpen = $state(false);

	// --- Estado para el diálogo de cálculo ---
	let isCalcDialogOpen = $state(false);
	let quantity = $state(100);

	const calculatedMacros = $derived(
		((() => {
			const factor = quantity / 100;
			return {
				calories: (ingredient.calories * factor).toFixed(1),
				protein: (ingredient.protein * factor).toFixed(1),
				fat: (ingredient.fat * factor).toFixed(1),
				carbs: (ingredient.carbs * factor).toFixed(1)
			};
		})())
	);

	function openEditDialog() {
		editingProductId = ingredient.id;
		editingProductName = ingredient.name;
		calories = ingredient.calories;
		protein = ingredient.protein;
		fat = ingredient.fat;
		carbs = ingredient.carbs;
	}

	function closeEditDialog() {
		editingProductId = null;
	}
</script>

<div class="flex justify-end gap-2">
	<!-- Botón de Calcular -->
	<Dialog.Root bind:open={isCalcDialogOpen}>
		<Dialog.Trigger
			class={buttonVariants({ variant: 'outline', size: 'icon' })}
			title="Calcular Macros"
		>
			<Calculator class="h-4 w-4" />
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Calcular Nutrientes</Dialog.Title>
				<Dialog.Description
					>Calcula los macros para una cantidad específica de {ingredient.name}.</Dialog.Description
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
						<p><strong>Calorías:</strong> {calculatedMacros.calories} kcal</p>
						<p><strong>Proteínas:</strong> {calculatedMacros.protein} g</p>
						<p><strong>Grasas:</strong> {calculatedMacros.fat} g</p>
						<p><strong>Carbohidratos:</strong> {calculatedMacros.carbs} g</p>
					</div>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Botón de Editar -->
	<Dialog.Root
		open={editingProductId === ingredient.id}
		onOpenChange={(isOpen) => {
			if (!isOpen) {
				closeEditDialog();
			}
		}}
	>
		<Dialog.Trigger
			class={buttonVariants({ variant: 'outline', size: 'icon' })}
			title="Editar"
			onclick={openEditDialog}
		>
			<Pencil class="h-4 w-4" />
		</Dialog.Trigger>
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
				<input type="hidden" name="id" value={ingredient.id} />
				<div class="grid gap-4 py-4">
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="name-edit-{ingredient.id}" class="text-right">Nombre</Label>
						<Input
							id="name-edit-{ingredient.id}"
							name="name"
							bind:value={editingProductName}
							class="col-span-3"
						/>
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="calories-edit-{ingredient.id}" class="text-right">Calorías</Label>
						<Input
							id="calories-edit-{ingredient.id}"
							name="calories"
							type="number"
							step="0.01"
							bind:value={calories}
							class="col-span-3 hide-arrows"
						/>
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="protein-edit-{ingredient.id}" class="text-right">Proteínas</Label>
						<Input
							id="protein-edit-{ingredient.id}"
							name="protein"
							type="number"
							step="0.01"
							bind:value={protein}
							class="col-span-3 hide-arrows"
						/>
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="fat-edit-{ingredient.id}" class="text-right">Grasas</Label>
						<Input
							id="fat-edit-{ingredient.id}"
							name="fat"
							type="number"
							step="0.01"
							bind:value={fat}
							class="col-span-3 hide-arrows"
						/>
					</div>
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="carbs-edit-{ingredient.id}" class="text-right">Carbohidratos</Label>
						<Input
							id="carbs-edit-{ingredient.id}"
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

	<!-- Botón de Eliminar -->
	<Dialog.Root bind:open={isDeleteDialogOpen}>
		<Dialog.Trigger
			class={buttonVariants({ variant: 'destructive', size: 'icon' })}
			title="Eliminar"
		>
			<Trash2 class="h-4 w-4" />
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Confirmar Eliminación</Dialog.Title>
				<Dialog.Description>
					¿Estás seguro de que quieres eliminar el producto "{ingredient.name}"? Esta acción no se
					puede deshacer.
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
				<input type="hidden" name="id" value={ingredient.id} />
				<Dialog.Footer>
					<Dialog.Close class={buttonVariants({ variant: 'outline' })}>Cancelar</Dialog.Close>
					<Button variant="destructive" type="submit">Eliminar</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>
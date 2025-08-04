<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import type { Product } from '@prisma/client';

	let {
		ingredient,
		isProductEditDialogOpen = $bindable(),
		editingProductName = $bindable(),
		editingProductId = $bindable(),
		handleUpdateProductName
	} = $props<{
		ingredient: Product;
		isProductEditDialogOpen: boolean;
		editingProductName: string;
		editingProductId: string | null;
		handleUpdateProductName: () => Promise<void>;
	}>();

	function openEditDialog() {
		isProductEditDialogOpen = true;
		editingProductName = ingredient.name;
		editingProductId = ingredient.id;
	}
</script>

<div class="flex justify-end gap-2">
	{#if ingredient.source === 'custom'}
		<Dialog.Root>
			<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })}>Editar</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>Editar Ingrediente</Dialog.Title>
				</Dialog.Header>
				<form method="POST" action="?/update" use:enhance>
					<input type="hidden" name="id" value={ingredient.id} />
					<div class="grid gap-4 py-4">
						<div class="grid grid-cols-4 items-center gap-4">
							<Label for="name-edit-{ingredient.id}" class="text-right">Nombre</Label>
							<Input
								id="name-edit-{ingredient.id}"
								name="name"
								value={ingredient.name}
								class="col-span-3"
							/>
						</div>
						<div class="grid grid-cols-4 items-center gap-4">
							<Label for="calories-edit-{ingredient.id}" class="text-right">Calorías</Label>
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
							<Label for="protein-edit-{ingredient.id}" class="text-right">Proteínas</Label>
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
							<Label for="fat-edit-{ingredient.id}" class="text-right">Grasas</Label>
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
							<Label for="carbs-edit-{ingredient.id}" class="text-right">Carbohidratos</Label>
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
						<Dialog.Close class={buttonVariants()} type="submit">Guardar Cambios</Dialog.Close>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	{:else}
		<Dialog.Root bind:open={isProductEditDialogOpen}>
			<Dialog.Trigger class={buttonVariants({ variant: 'outline', size: 'sm' })} onclick={openEditDialog}
				>Editar</Dialog.Trigger
			>
			<Dialog.Content class="sm:max-w-[425px]">
				<Dialog.Header>
					<Dialog.Title>Editar Nombre del Producto</Dialog.Title>
				</Dialog.Header>
				<div class="grid gap-4 py-4">
					<div class="grid grid-cols-4 items-center gap-4">
						<Label for="name-edit-off-{ingredient.id}" class="text-right">Nombre</Label>
						<Input
							id="name-edit-off-{ingredient.id}"
							bind:value={editingProductName}
							class="col-span-3"
						/>
					</div>
				</div>
				<Dialog.Footer>
					<Button onclick={handleUpdateProductName}>Guardar Cambios</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
	<Dialog.Root>
		<Dialog.Trigger class={buttonVariants({ variant: 'destructive', size: 'sm' })}
			>Eliminar</Dialog.Trigger
		>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Confirmar Eliminación</Dialog.Title>
				<Dialog.Description>
					¿Estás seguro de que quieres eliminar el ingrediente "{ingredient.name}"? Esta acción no se
					puede deshacer.
				</Dialog.Description>
			</Dialog.Header>
			<form method="POST" action="?/delete" use:enhance>
				<input type="hidden" name="id" value={ingredient.id} />
				<input type="hidden" name="source" value={ingredient.source} />
				<Dialog.Footer>
					<Dialog.Close class={buttonVariants({ variant: 'outline' })}>Cancelar</Dialog.Close>
					<Button variant="destructive" type="submit">Eliminar</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>
    
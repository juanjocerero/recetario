<!-- Ruta: src/routes/admin/ingredientes/+page.svelte -->
<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form: ActionData;

	let isCreateDialogOpen = false;
	let isEditDialogOpen = false;
	let isDeleteDialogOpen = false;
	let selectedIngredient: PageData['ingredients'][0] | null = null;

	// --- Manejadores de Diálogos ---
	function openCreateDialog() {
		isCreateDialogOpen = true;
	}

	function openEditDialog(ingredient: PageData['ingredients'][0]) {
		selectedIngredient = ingredient;
		isEditDialogOpen = true;
	}

	function openDeleteDialog(ingredient: PageData['ingredients'][0]) {
		selectedIngredient = ingredient;
		isDeleteDialogOpen = true;
	}

	// --- Reactividad para cerrar diálogos tras éxito ---
	$: if (form?.success) {
		isCreateDialogOpen = false;
		isEditDialogOpen = false;
		isDeleteDialogOpen = false;
		selectedIngredient = null;
	}
</script>

<div class="container mx-auto py-10">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold">Gestión de Ingredientes Personalizados</h1>
		<Button onclick={openCreateDialog}>Añadir Ingrediente</Button>
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Nombre</Table.Head>
					<Table.Head class="text-right">Calorías (por 100g)</Table.Head>
					<Table.Head class="text-right">Proteínas (g)</Table.Head>
					<Table.Head class="text-right">Grasas (g)</Table.Head>
					<Table.Head class="text-right">Carbs (g)</Table.Head>
					<Table.Head class="text-right">Acciones</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.ingredients as ingredient (ingredient.id)}
					<Table.Row>
						<Table.Cell class="font-medium">{ingredient.name}</Table.Cell>
						<Table.Cell class="text-right">{ingredient.calories}</Table.Cell>
						<Table.Cell class="text-right">{ingredient.protein}</Table.Cell>
						<Table.Cell class="text-right">{ingredient.fat}</Table.Cell>
						<Table.Cell class="text-right">{ingredient.carbs}</Table.Cell>
						<Table.Cell class="text-right">
							<Button variant="outline" size="sm" onclick={() => openEditDialog(ingredient)}
								>Editar</Button
							>
							<Button variant="destructive" size="sm" class="ml-2" onclick={() => openDeleteDialog(ingredient)}
								>Eliminar</Button
							>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={6} class="text-center">No hay ingredientes personalizados.</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>

<!-- Dialogo para CREAR Ingrediente -->
<Dialog.Root bind:open={isCreateDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Añadir Nuevo Ingrediente</Dialog.Title>
			<Dialog.Description>
				Completa los detalles del ingrediente personalizado. Todos los valores son por 100g.
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/create" use:enhance>
			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="name" class="text-right">Nombre</Label>
					<Input id="name" name="name" class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="calories" class="text-right">Calorías</Label>
					<Input id="calories" name="calories" type="number" step="0.1" class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="protein" class="text-right">Proteínas</Label>
					<Input id="protein" name="protein" type="number" step="0.1" class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="fat" class="text-right">Grasas</Label>
					<Input id="fat" name="fat" type="number" step="0.1" class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="carbs" class="text-right">Carbs</Label>
					<Input id="carbs" name="carbs" type="number" step="0.1" class="col-span-3" />
				</div>
			</div>
			<Dialog.Footer>
				<Button type="submit">Guardar Ingrediente</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Dialogo para EDITAR Ingrediente -->
{#if selectedIngredient}
<Dialog.Root bind:open={isEditDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Editar Ingrediente</Dialog.Title>
		</Dialog.Header>
		<form method="POST" action="?/update" use:enhance>
			<input type="hidden" name="id" value={selectedIngredient.id} />
			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="name-edit" class="text-right">Nombre</Label>
					<Input id="name-edit" name="name" value={selectedIngredient.name} class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="calories-edit" class="text-right">Calorías</Label>
					<Input id="calories-edit" name="calories" type="number" step="0.1" value={selectedIngredient.calories} class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="protein-edit" class="text-right">Proteínas</Label>
					<Input id="protein-edit" name="protein" type="number" step="0.1" value={selectedIngredient.protein} class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="fat-edit" class="text-right">Grasas</Label>
					<Input id="fat-edit" name="fat" type="number" step="0.1" value={selectedIngredient.fat} class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="carbs-edit" class="text-right">Carbs</Label>
					<Input id="carbs-edit" name="carbs" type="number" step="0.1" value={selectedIngredient.carbs} class="col-span-3" />
				</div>
			</div>
			<Dialog.Footer>
				<Button type="submit">Guardar Cambios</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
{/if}

<!-- Dialogo para ELIMINAR Ingrediente -->
{#if selectedIngredient}
<Dialog.Root bind:open={isDeleteDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Confirmar Eliminación</Dialog.Title>
			<Dialog.Description>
				¿Estás seguro de que quieres eliminar el ingrediente "{selectedIngredient.name}"? Esta acción no se puede deshacer.
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/delete" use:enhance>
			<input type="hidden" name="id" value={selectedIngredient.id} />
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => isDeleteDialogOpen = false}>Cancelar</Button>
				<Button variant="destructive" type="submit">Eliminar</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
{/if}

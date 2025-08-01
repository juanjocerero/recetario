<!-- Ruta: src/routes/admin/ingredientes/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Table from '$lib/components/ui/table';
	import type { ActionData, PageData } from './$types';
	
	let { data, form } = $props<{ data: PageData; form: ActionData }>();
</script>

<div class="container mx-auto py-10">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold">Gestión de Ingredientes</h1>
		<div class="flex gap-2">
			<a href="/admin/ingredientes/off" class={buttonVariants({ variant: 'outline' })}>
				Añadir desde Open Food Facts
			</a>
			<Dialog.Root>
				<Dialog.Trigger class={buttonVariants()}>Añadir Ingrediente Personalizado</Dialog.Trigger>
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
								<Label for="carbs" class="text-right">Carbohidratos</Label>
								<Input id="carbs" name="carbs" type="number" step="0.1" class="col-span-3" />
							</div>
						</div>
						<Dialog.Footer>
							<Dialog.Close class={buttonVariants()} type="submit">Guardar Ingrediente</Dialog.Close>
						</Dialog.Footer>
					</form>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>
	
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Nombre</Table.Head>
					<Table.Head>Origen</Table.Head>
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
					<Table.Cell>
						{#if ingredient.source === 'custom'}
						<span class="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
							Personalizado
						</span>
						{:else}
						<span class="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
							Caché de OFF
						</span>
						{/if}
					</Table.Cell>
					<Table.Cell class="text-right">{ingredient.calories?.toFixed(2) ?? 'N/A'}</Table.Cell>
					<Table.Cell class="text-right">{ingredient.protein?.toFixed(2) ?? 'N/A'}</Table.Cell>
					<Table.Cell class="text-right">{ingredient.fat?.toFixed(2) ?? 'N/A'}</Table.Cell>
					<Table.Cell class="text-right">{ingredient.carbs?.toFixed(2) ?? 'N/A'}</Table.Cell>
					<Table.Cell class="text-right">
						<Dialog.Root>
							<Button
							variant="outline"
							size="sm"
							disabled={ingredient.source !== 'custom'}
							onclick={(e) => {
								if (ingredient.source !== 'custom') e.preventDefault();
								// Lógica para abrir el diálogo si es necesario
							}}
							>
							Editar
						</Button>
						<Dialog.Content class="sm:max-w-[425px]">
							<Dialog.Header>
								<Dialog.Title>Editar Ingrediente</Dialog.Title>
							</Dialog.Header>
							<form method="POST" action="?/update" use:enhance>
								<input type="hidden" name="id" value={ingredient.id} />
								<div class="grid gap-4 py-4">
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="name-edit" class="text-right">Nombre</Label>
										<Input
										id="name-edit"
										name="name"
										value={ingredient.name}
										class="col-span-3"
										/>
									</div>
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="calories-edit" class="text-right">Calorías</Label>
										<Input
										id="calories-edit"
										name="calories"
										type="number"
										step="0.1"
										value={ingredient.calories}
										class="col-span-3"
										/>
									</div>
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="protein-edit" class="text-right">Proteínas</Label>
										<Input
										id="protein-edit"
										name="protein"
										type="number"
										step="0.1"
										value={ingredient.protein}
										class="col-span-3"
										/>
									</div>
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="fat-edit" class="text-right">Grasas</Label>
										<Input
										id="fat-edit"
										name="fat"
										type="number"
										step="0.1"
										value={ingredient.fat}
										class="col-span-3"
										/>
									</div>
									<div class="grid grid-cols-4 items-center gap-4">
										<Label for="carbs-edit" class="text-right">Carbohidratos</Label>
										<Input
										id="carbs-edit"
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
					<Dialog.Root>
						<Dialog.Trigger
						class={buttonVariants({ variant: 'destructive', size: 'sm' }) + ' ml-2'}
						>Eliminar</Dialog.Trigger
						>
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
				</Table.Cell>
			</Table.Row>
			{:else}
			<Table.Row>
				<Table.Cell colspan={7} class="text-center">No hay ingredientes.</Table.Cell>
			</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
</div>
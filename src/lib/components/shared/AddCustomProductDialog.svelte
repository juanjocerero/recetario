<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	let {
		open = $bindable(),
		form = $bindable(),
		action = '?/addCustom'
	} = $props<{
		open: boolean;
		form: any;
		action?: string;
	}>();

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

	function clearForm() {
		name = '';
		calories = '';
		protein = '';
		fat = '';
		carbs = '';
		form = null;
	}

	function closeDialog() {
		open = false;
	}
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && closeDialog()}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Añadir nuevo producto</Dialog.Title>
			<Dialog.Description>Añade un nuevo producto con sus macros por 100g.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			{action}
			use:enhance={() => {
				const toastId = toast.loading('Añadiendo producto...');
				return async ({ result }) => {
					if (result.type === 'success') {
						toast.success('Producto añadido con éxito.', { id: toastId });
						closeDialog();
						clearForm();
						await invalidateAll();
					} else if (result.type === 'failure') {
						form = result.data;
						toast.error('Error al añadir el producto.', { id: toastId });
					} else if (result.type !== 'error') {
						toast.dismiss(toastId);
					}
					if (result.type === 'error') {
						toast.error('Error inesperado del servidor.', { id: toastId });
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
					<p class="col-span-3 col-start-2 text-sm text-red-500">{form.errors.name[0]}</p>
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
					<p class="col-span-3 col-start-2 text-sm text-red-500">{form.errors.calories[0]}</p>
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
					<p class="col-span-3 col-start-2 text-sm text-red-500">{form.errors.fat[0]}</p>
				{/if}
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="carbs" class="text-right">Carbs</Label>
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
					<p class="col-span-3 col-start-2 text-sm text-red-500">{form.errors.carbs[0]}</p>
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
					<p class="col-span-3 col-start-2 text-sm text-red-500">{form.errors.protein[0]}</p>
				{/if}
			</div>
			<Dialog.Footer>
				<Dialog.Close class={buttonVariants({ variant: 'outline' })} onclick={closeDialog}
					>Cancelar</Dialog.Close
				>
				<Button type="submit">Guardar</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance, applyAction } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	
	type ProductData = {
		id: string; // barcode for OFF
		name: string;
		imageUrl: string | null;
		calories: number;
		protein: number;
		fat: number;
		carbs: number;
	};
	
	let {
		product,
		open = $bindable(),
		onProductAdded = (id: string) => {}
	} = $props<{
		product: ProductData;
		open: boolean;
		onProductAdded?: (id: string) => void;
	}>();
	
	// Estado local para los campos del formulario
	let name = $state(product.name);
	let calories = $state(product.calories);
	let protein = $state(product.protein);
	let fat = $state(product.fat);
	let carbs = $state(product.carbs);
	
	let displayCalories = $state(product.calories.toFixed(2));
	let displayProtein = $state(product.protein.toFixed(2));
	let displayFat = $state(product.fat.toFixed(2));
	let displayCarbs = $state(product.carbs.toFixed(2));
	
	// Efecto para resetear el estado del formulario si el producto cambia
	$effect(() => {
		name = product.name;
		calories = product.calories;
		protein = product.protein;
		fat = product.fat;
		carbs = product.carbs;
		
		displayCalories = product.calories.toFixed(2);
		displayProtein = product.protein.toFixed(2);
		displayFat = product.fat.toFixed(2);
		displayCarbs = product.carbs.toFixed(2);
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Añadir Producto</Dialog.Title>
			<Dialog.Description>
				Revisa y ajusta los datos del producto antes de añadirlo a tu base de datos.
			</Dialog.Description>
		</Dialog.Header>
		<form
		method="POST"
		action="?/add"
		use:enhance={() => {
			const toastId = toast.loading('Añadiendo producto...');
			return async ({ result }) => {
				await applyAction(result);
				if (result.type === 'success') {
					toast.success('Producto añadido correctamente.', { id: toastId });
					open = false;
					onProductAdded(product.id);
					await invalidateAll();
				} else if (result.type === 'failure') {
					let message = 'Error al añadir el producto.';
					if (result.data && typeof (result.data as any).error === 'string') {
						message = (result.data as any).error;
					}
					toast.error(message, { id: toastId });
				} else {
					toast.dismiss(toastId);
				}
			};
		}}
		>
		<input type="hidden" name="barcode" value={product.id} />
		<input type="hidden" name="imageUrl" value={product.imageUrl ?? ''} />
		<input type="hidden" name="calories" value={calories} />
		<input type="hidden" name="protein" value={protein} />
		<input type="hidden" name="fat" value={fat} />
		<input type="hidden" name="carbs" value={carbs} />
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="name-add-{product.id}" class="text-right">Nombre</Label>
				<Input id="name-add-{product.id}" name="name" bind:value={name} class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="calories-add-{product.id}" class="text-right">Calorías</Label>
				<Input
				id="calories-add-{product.id}"
				type="number"
				step="0.01"
				value={displayCalories}
				oninput={(e) => {
					displayCalories = e.currentTarget.value;
					calories = e.currentTarget.valueAsNumber;
				}}
				class="col-span-3 hide-arrows"
				/>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="protein-add-{product.id}" class="text-right">Proteínas</Label>
				<Input
				id="protein-add-{product.id}"
				type="number"
				step="0.01"
				value={displayProtein}
				oninput={(e) => {
					displayProtein = e.currentTarget.value;
					protein = e.currentTarget.valueAsNumber;
				}}
				class="col-span-3 hide-arrows"
				/>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="fat-add-{product.id}" class="text-right">Grasas</Label>
				<Input
				id="fat-add-{product.id}"
				type="number"
				step="0.01"
				value={displayFat}
				oninput={(e) => {
					displayFat = e.currentTarget.value;
					fat = e.currentTarget.valueAsNumber;
				}}
				class="col-span-3 hide-arrows"
				/>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="carbs-add-{product.id}" class="text-right">Carbs</Label>
				<Input
				id="carbs-add-{product.id}"
				type="number"
				step="0.01"
				value={displayCarbs}
				oninput={(e) => {
					displayCarbs = e.currentTarget.value;
					carbs = e.currentTarget.valueAsNumber;
				}}
				class="col-span-3 hide-arrows"
				/>
			</div>
		</div>
		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'outline' })} type="button">Cancelar</Dialog.Close>
			<Button type="submit">Añadir a la base de datos</Button>
		</Dialog.Footer>
	</form>
</Dialog.Content>
</Dialog.Root>

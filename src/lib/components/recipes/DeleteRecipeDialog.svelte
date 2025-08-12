<!--
Fichero: src/lib/components/recipes/DeleteRecipeDialog.svelte
omponente para un diálogo de confirmación de borrado seguro.
-->
<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';
	
	// Justificación: El tipo ahora usa `title` para coincidir con el esquema de Prisma.
	type Recipe = {
		id: string;
		title: string;
	};
	
	// --- PROPS (Svelte 5) ---
	// Justificación: `open` se declara con `$bindable()` para permitir el enlace
	// bidireccional desde el componente padre, como exige Svelte 5.
	let { recipe, open = $bindable(), onOpenChange }: {
		recipe: Recipe | null;
		open?: boolean;
		onOpenChange: (isOpen: boolean) => void;
	} = $props();
	
	let formElement: HTMLFormElement;
	
	function handleConfirmClick() {
		if (formElement) {
			formElement.requestSubmit();
		}
	}
</script>

<AlertDialog.Root bind:open onOpenChange={onOpenChange}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>¿Estás absolutely seguro?</AlertDialog.Title>
			<AlertDialog.Description>
				Esta acción no se puede deshacer. Esto eliminará permanentemente la receta de
				<strong>{@html recipe?.title ?? 'seleccionada'}</strong>.
			</AlertDialog.Description>
		</AlertDialog.Header>
		
		<form
		method="POST"
		action="?/delete"
		bind:this={formElement}
		use:enhance={() => {
			onOpenChange(false);
			const toastId = toast.loading('Eliminando receta...');
			
			return async ({ result }) => {
				await applyAction(result);
				if (result.type === 'success') {
					toast.success('Receta eliminada correctamente.', { id: toastId });
				} else if (result.type === 'failure') {
					toast.error('No se pudo eliminar la receta.', { id: toastId });
				} else {
					toast.dismiss(toastId);
				}
			};
		}}
		>
		<input type="hidden" name="id" value={recipe?.id} />
	</form>
	
	<AlertDialog.Footer>
		<AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
		<AlertDialog.Action onclick={handleConfirmClick}>
			<Button variant="destructive">Eliminar</Button>
		</AlertDialog.Action>
	</AlertDialog.Footer>
</AlertDialog.Content>
</AlertDialog.Root>

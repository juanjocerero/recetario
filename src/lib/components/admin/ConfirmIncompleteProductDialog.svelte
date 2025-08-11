<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	let {
		open = $bindable(),
		productName,
		onConfirm = () => {},
		onCancel = () => {}
	} = $props<{
		open: boolean;
		productName: string;
		onConfirm: () => void;
		onCancel: () => void;
	}>();

	function handleCancel() {
		open = false;
		onCancel();
	}

	function handleConfirm() {
		open = false;
		onConfirm();
	}
</script>

<AlertDialog.Root
	bind:open
	onOpenChange={(isOpen) => {
		if (!isOpen) {
			// If dialog is closed by any means (ESC, overlay click), treat as cancel.
			onCancel();
		}
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Datos incompletos</AlertDialog.Title>
			<AlertDialog.Description>
				El producto "<strong>{@html productName}</strong>" tiene valores nutricionales incompletos o en
				cero. ¿Quieres añadirlo de todas formas? Podrás editar los valores manualmente.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={handleCancel}>No, descartar</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleConfirm}>Sí, añadir</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

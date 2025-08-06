<!-- Ruta: src/lib/components/admin/SyncDialog.svelte -->
<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { CircleDashed } from 'lucide-svelte';

	// Justificación: Este componente ahora solo se encarga de mostrar el *contenido* del diálogo.
	// El control de apertura/cierre y el disparador se gestionan en la página padre,
	// siguiendo las convenciones del proyecto y de Svelte 5.
	type $Props = {
		state: 'idle' | 'loading' | 'success' | 'error';
		result: {
			updatedIngredients: string[];
			failedIngredients: { id: string; name: string; reason: string }[];
		} | null;
	};

	let { state, result }: $Props = $props();
</script>

<Dialog.Content class="sm:max-w-[625px]">
	{#if state === 'loading'}
		<div class="flex flex-col items-center justify-center p-8">
			<CircleDashed class="h-12 w-12 animate-spin text-primary" />
			<p class="mt-4 text-lg text-muted-foreground">Sincronizando ingredientes...</p>
			<p class="text-sm text-muted-foreground">
				Este proceso puede tardar varios minutos. Por favor, no cierres esta ventana.
			</p>
		</div>
	{:else if state === 'success' && result}
		<Dialog.Header>
			<Dialog.Title>Sincronización Completada</Dialog.Title>
			<Dialog.Description>
				Se actualizaron <strong>{result.updatedIngredients.length}</strong> ingredientes.
				{#if result.failedIngredients.length > 0}
					Hubo <strong>{result.failedIngredients.length}</strong> errores.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<div class="max-h-[400px] overflow-y-auto">
			{#if result.updatedIngredients.length > 0}
				<h3 class="mb-2 font-semibold">Ingredientes Actualizados</h3>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nombre</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each result.updatedIngredients as name}
							<TableRow>
								<TableCell>{name}</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
			{#if result.failedIngredients.length > 0}
				<h3 class="mb-2 mt-4 font-semibold">Ingredientes con Errores</h3>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nombre</TableHead>
							<TableHead>Motivo del Error</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each result.failedIngredients as failure}
							<TableRow>
								<TableCell>{failure.name} ({failure.id})</TableCell>
								<TableCell>{failure.reason}</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</div>
		<Dialog.Footer>
			<!-- Justificación: Se usa Dialog.Close directamente estilizado como un botón,
			     evitando la complejidad y errores de 'asChild'. -->
			<Dialog.Close class={buttonVariants({ variant: 'outline' })}>Cerrar</Dialog.Close>
		</Dialog.Footer>
	{:else if state === 'error'}
		<Dialog.Header>
			<Dialog.Title>Error en la Sincronización</Dialog.Title>
			<Dialog.Description>
				Ocurrió un error inesperado al intentar sincronizar los ingredientes. Por favor, inténtalo
				de nuevo más tarde.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'outline' })}>Cerrar</Dialog.Close>
		</Dialog.Footer>
	{/if}
</Dialog.Content>

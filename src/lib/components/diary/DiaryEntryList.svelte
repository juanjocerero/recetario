<!-- Ruta: src/lib/components/diary/DiaryEntryList.svelte -->
<script lang="ts">
	import type { DiaryEntry } from '@prisma/client';
	import MacroBar from '$lib/components/shared/MacroBar.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import EditEntryDialog from './EditEntryDialog.svelte';
	import { Separator } from '$lib/components/ui/separator';

	let { entries, onDelete }: {
		entries: DiaryEntry[];
		onDelete: (entry: DiaryEntry) => void;
	} = $props();

	let selectedEntry = $state<DiaryEntry | null>(null);
	let entryToDelete = $state<DiaryEntry | null>(null);
	let isEditDialogOpen = $state(false);
	let isDeleteDialogOpen = $state(false);

	const groupedEntriesArray = $derived(() => {
		const map = new Map<string, DiaryEntry[]>();
		for (const entry of entries) {
			// Normalizamos la fecha a medianoche en UTC para agrupar correctamente
			const date = new Date(entry.date);
			const dateKey = new Date(
				date.getUTCFullYear(),
				date.getUTCMonth(),
				date.getUTCDate()
			).toISOString();

			if (!map.has(dateKey)) {
				map.set(dateKey, []);
			}
			map.get(dateKey)!.push(entry);
		}
		return Array.from(map.entries());
	});

	const dateFormatter = new Intl.DateTimeFormat('es-ES', {
		dateStyle: 'full'
	});

	function handleOpenEditDialog(entry: DiaryEntry) {
		selectedEntry = entry;
		isEditDialogOpen = true;
	}

	function handleOpenDeleteDialog(entry: DiaryEntry) {
		entryToDelete = entry;
		isDeleteDialogOpen = true;
	}

	function confirmDelete() {
		if (entryToDelete) {
			onDelete(entryToDelete);
		}
		isDeleteDialogOpen = false;
	}

	async function handleSave(updatedEntry: DiaryEntry) {
		try {
			const response = await fetch(`/api/diary/${updatedEntry.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedEntry)
			});

			if (response.ok) {
				const result = await response.json();
				const index = entries.findIndex((e) => e.id === result.id);
				if (index !== -1) {
					entries[index] = result;
				}
			} else {
				console.error('Error al actualizar la entrada:', await response.text());
			}
		} catch (error) {
			console.error('Error de red al actualizar:', error);
		}
	}
</script>

<div class="space-y-4">
	{#if entries.length > 0}
		{#each groupedEntriesArray() as [dateKey, dayEntries] (dateKey)}
			<div class="day-group pt-4 pb-4">
				<div class="flex items-center gap-4 mb-3">
					<h3 class="text-lg font-semibold whitespace-nowrap">
						{dateFormatter.format(new Date(dateKey))}
					</h3>
					<Separator class="flex-1" />
				</div>
				<div class="space-y-3">
					{#each dayEntries as entry (entry.id)}
						<div
							class="flex flex-row items-start md:items-center gap-4 rounded-lg border p-3 bg-card"
						>
							<!-- Nombre y cantidad (apilable) -->
							<div class="flex-1 min-w-0">
								<p class="font-semibold whitespace-normal">{entry.name}</p>
								<p class="text-sm text-muted-foreground">
									{entry.quantity.toFixed(0)}g &bull; {entry.calories.toFixed(0)} kcal
								</p>
							</div>

							<!-- MacroBar (ocupa más espacio en pantallas grandes) -->
							<div class="w-40 md:w-64 flex-shrink-0">
								<MacroBar protein={entry.protein} carbs={entry.carbs} fat={entry.fat} />
							</div>

							<!-- Botones de acción -->
							<div class="flex gap-2 self-end md:self-center">
								<Button onclick={() => handleOpenEditDialog(entry)} variant="ghost" size="icon">
									<Pencil class="h-4 w-4" />
									<span class="sr-only">Editar</span>
								</Button>
								<Button onclick={() => handleOpenDeleteDialog(entry)} variant="ghost" size="icon">
									<Trash2 class="h-4 w-4" />
									<span class="sr-only">Eliminar</span>
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{:else}
		<p class="text-center text-muted-foreground py-8">
			No hay entradas para la fecha seleccionada.
		</p>
	{/if}
</div>

<!-- Diálogo de Edición -->
<EditEntryDialog
	entry={selectedEntry}
	bind:open={isEditDialogOpen}
	onOpenChange={(isOpen) => (isEditDialogOpen = isOpen)}
	onSave={handleSave}
/>

<!-- Diálogo de Confirmación de Eliminación -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>¿Estás seguro?</AlertDialog.Title>
			<AlertDialog.Description>
				Esta acción no se puede deshacer. Se eliminará permanentemente la entrada
				"{entryToDelete?.name}" de tu diario.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDelete}>Eliminar</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
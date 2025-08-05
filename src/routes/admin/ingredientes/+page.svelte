<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import IngredientsDesktopView from '$lib/components/admin/IngredientsDesktopView.svelte';
	import IngredientsMobileView from '$lib/components/admin/IngredientsMobileView.svelte';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	// --- Lógica de búsqueda y ordenación ---
	let searchTerm = $state(data.search ?? '');

	$effect(() => {
		// Capturamos el valor actual de searchTerm para asegurar la dependencia en el efecto.
		// Esto previene un "Heisenbug" donde el compilador de Svelte podría optimizar
		// incorrectamente la dependencia al estar solo dentro de un callback asíncrono.
		const currentSearchTerm = searchTerm;

		const handler = setTimeout(() => {
			const url = new URL(page.url);
			if (currentSearchTerm) {
				url.searchParams.set('search', currentSearchTerm);
			} else {
				url.searchParams.delete('search');
			}

			if (url.search !== page.url.search) {
				goto(url, { keepFocus: true, noScroll: true, replaceState: true });
			}
		}, 300);

		return () => {
			clearTimeout(handler);
		};
	});

	function sort(column: string) {
		const url = new URL(page.url);
		const currentSort = url.searchParams.get('sort');
		const currentOrder = url.searchParams.get('order');
		const newOrder = currentSort === column && currentOrder === 'asc' ? 'desc' : 'asc';
		url.searchParams.set('sort', column);
		url.searchParams.set('order', newOrder);
		goto(url, { keepFocus: true, noScroll: true, replaceState: true });
	}

	// --- Lógica para el diálogo de edición de productos ---
	let isProductEditDialogOpen = $state(false);
	let editingProductName = $state('');
	let editingProductId = $state<string | null>(null);

	async function handleUpdateProductName() {
		if (!editingProductId) return;

		const toastId = toast.loading('Actualizando nombre del producto...');
		try {
			const productId = editingProductId.startsWith('product-')
				? editingProductId.substring(8)
				: editingProductId;
			const encodedProductId = encodeURIComponent(productId);

			const response = await fetch(`/api/products/${encodedProductId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: editingProductName })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || 'Error al actualizar el nombre');
			}

			toast.success('Nombre del producto actualizado con éxito.', { id: toastId });
			await invalidateAll();
			isProductEditDialogOpen = false;
		} catch (error) {
			console.error('Error al actualizar el nombre del producto:', error);
			const message = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
			toast.error(message, { id: toastId });
		}
	}
</script>

<div class="container mx-auto py-10">
	<IngredientsDesktopView
		{data}
		{form}
		bind:searchTerm
		bind:isProductEditDialogOpen
		bind:editingProductName
		bind:editingProductId
		{handleUpdateProductName}
	/>
	<IngredientsMobileView
		{data}
		bind:searchTerm
		{sort}
		bind:isProductEditDialogOpen
		bind:editingProductName
		bind:editingProductId
		{handleUpdateProductName}
	/>
</div>

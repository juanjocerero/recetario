<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ProductsDesktopView from '$lib/components/admin/ProductsDesktopView.svelte';
	import ProductsMobileView from '$lib/components/admin/ProductsMobileView.svelte';
	import type { SortDirection, SortField } from '$lib/components/admin/ProductSortOptions.svelte';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	// --- Lógica de búsqueda y ordenación ---
	let searchTerm = $state(data.search ?? '');
	let sort = $state<SortField>(data.sort ?? 'normalizedName');
	let direction = $state<SortDirection>(data.order ?? 'asc');

	$effect(() => {
		// Capturamos el valor actual de las dependencias para asegurar su correcta
		// captura en el callback asíncrono, previniendo "Heisenbugs".
		const currentSearchTerm = searchTerm;
		const currentSort = sort;
		const currentDirection = direction;

		const handler = setTimeout(() => {
			const url = new URL(page.url);

			// Gestionar parámetro de búsqueda
			if (currentSearchTerm) {
				url.searchParams.set('search', currentSearchTerm);
			} else {
				url.searchParams.delete('search');
			}

			// Gestionar parámetros de ordenación
			url.searchParams.set('sort', currentSort);
			url.searchParams.set('order', currentDirection);

			// Al buscar u ordenar, volver a la primera página
			url.searchParams.delete('page');

			if (url.search !== page.url.search) {
				goto(url, { keepFocus: true, noScroll: true, replaceState: true });
			}
		}, 300);

		return () => {
			clearTimeout(handler);
		};
	});

	// --- Lógica para el diálogo de edición de productos ---
	let editingProductName = $state('');
	let editingProductId = $state<string | null>(null);
</script>

<div class="container mx-auto px-4 md:py-4 md:px-24">
	<ProductsDesktopView
		{data}
		{form}
		bind:searchTerm
		bind:sort
		bind:direction
		bind:editingProductName
		bind:editingProductId
	/>
	<ProductsMobileView
		{data}
		{form}
		bind:searchTerm
		bind:sort
		bind:direction
		bind:editingProductName
		bind:editingProductId
	/>
</div>
	
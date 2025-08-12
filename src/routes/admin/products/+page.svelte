<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ProductsDesktopView from '$lib/components/admin/ProductsDesktopView.svelte';
	import ProductsMobileView from '$lib/components/admin/ProductsMobileView.svelte';
	
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
	
	// --- Lógica para el diálogo de edición de productos ---
	let editingProductName = $state('');
	let editingProductId = $state<string | null>(null);
	</script>
	
	<div class="container mx-auto p-4 md:py-8 md:px-24">
		<ProductsDesktopView
		{data}
		{form}
		bind:searchTerm
		bind:editingProductName
		bind:editingProductId
		/>
		<ProductsMobileView
		{data}
		{form}
		bind:searchTerm
		bind:editingProductName
		bind:editingProductId
		/>
	</div>
	
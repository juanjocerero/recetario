<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { ArrowLeft, X } from 'lucide-svelte';
	import OFFProductDialog from '$lib/components/admin/OFFProductDialog.svelte';

	type SearchResult = {
		id: string;
		name: string;
		source: 'local' | 'off';
		imageUrl: string | null;
		calories: number;
		protein: number;
		fat: number;
		carbs: number;
	};

	let productToEdit = $state<SearchResult | null>(null);
	let isDialogOpen = $state(false);
	
	let searchTerm = $state('');
	let results = $state<SearchResult[]>([]);
	let isLoading = $state(false);
	let searchAttempted = $state(false);
	let page = $state(1);
	let hasMore = $state(true); // Para saber si hay más resultados que cargar

	function searchProducts(loadMore = false) {
		if (isLoading) return;

		if (!loadMore) {
			results = [];
			page = 1;
			hasMore = true;
		}

		isLoading = true;
		searchAttempted = true;

		const eventSource = new EventSource(
			`/api/products/search?q=${encodeURIComponent(searchTerm)}&page=${page}`
		);

		eventSource.addEventListener('message', (event) => {
			const newResults = JSON.parse(event.data);
			if (newResults.length === 0) {
				hasMore = false;
			} else {
				results = [...results, ...newResults];
				page++;
			}
		});

		eventSource.addEventListener('stream_error', (event) => {
			const errorData = JSON.parse((event as MessageEvent).data);
			console.error('Error de stream recibido:', errorData);
			isLoading = false;
			eventSource.close();
		});

		eventSource.onerror = (err) => {
			console.error('Error en la conexión de EventSource:', err);
			isLoading = false;
			eventSource.close();
		};

		eventSource.addEventListener('close', () => {
			isLoading = false;
			eventSource.close();
		});
	}

	$effect(() => {
		if (searchTerm.length < 3) {
			results = [];
			searchAttempted = false;
			isLoading = false;
			hasMore = true;
			page = 1;
		} else {
			const handler = setTimeout(() => {
				searchProducts();
			}, 300); // Debounce

			return () => clearTimeout(handler);
		}
	});

	function onVisible(node: HTMLElement, callback: () => void) {
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				callback();
			}
		});

		observer.observe(node);

		return {
			destroy() {
				observer.unobserve(node);
			}
		};
	}
</script>

<div class="container mx-auto p-4 md:py-8 md:px-24">
	<div class="space-y-8 p-4 md:p-8">
		<div class="flex items-center gap-4">
		<a href="/admin/products" class={buttonVariants({ variant: 'outline', size: 'icon' })}>
			<ArrowLeft class="h-4 w-4" />
		</a>
		<h1 class="text-xl font-bold">Añadir productos desde OpenFoodFacts</h1>
	</div>
		
		<div class="flex items-center gap-2">
			<div class="relative flex-grow">
			<Input
				bind:value={searchTerm}
				placeholder="Buscar por nombre (ej. tomate frito)..."
				class="pr-10"
			/>
			{#if searchTerm}
				<Button
					onclick={() => (searchTerm = '')}
					variant="ghost"
					size="icon"
					class="absolute right-0 top-0 h-full rounded-l-none"
				>
					<X class="h-4 w-4" />
				</Button>
			{/if}
		</div>
		</div>
		
		{#if isLoading && results.length === 0}
		<div class="flex justify-center py-8">
			<div class="spinner"></div>
		</div>
		{:else if results.length > 0}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
			{#each results as result, i (result.id)}
			<div animate:flip={{ duration: 300 }} in:fade={{ duration: 250, delay: i * 20 }}>
				<Card class={result.source === 'local' ? 'ring-2 ring-green-500' : ''}>
					<CardHeader>
						<img
						src={result.imageUrl || 'https://placehold.co/400x400?text=Sin+Imagen'}
						alt={result.name}
						class="aspect-square w-full rounded-md object-cover"
						/>
					</CardHeader>
					<CardContent class="flex flex-col justify-between space-y-4">
						<CardTitle class="text-sm">{result.name}</CardTitle>
						{#if result.source === 'off'}
							<Button
								onclick={() => {
									productToEdit = result;
									isDialogOpen = true;
								}}
								class="w-full"
							>
								Añadir
							</Button>
						{:else}
							<Button class="w-full" disabled>Añadido</Button>
						{/if}
					</CardContent>
				</Card>
			</div>
			{/each}
		</div>

		{#if isLoading && results.length > 0}
			<div class="flex justify-center py-4">
				<div class="spinner"></div>
			</div>
		{:else if hasMore && !isLoading}
			<div use:onVisible={() => searchProducts(true)} class="h-10"></div>
		{/if}

		{:else if !isLoading && searchAttempted}
		<div class="text-center text-gray-500 py-8">
			<p>No se encontraron resultados para tu búsqueda.</p>
		</div>
		{/if}
	</div>
	{#if productToEdit}
		<OFFProductDialog bind:open={isDialogOpen} product={productToEdit} />
	{/if}
</div>

<style>
	.spinner {
		border: 4px solid rgba(0, 0, 0, 0.1);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border-left-color: #09f;
		animation: spin 1s ease infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>


<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	type SearchResult = {
		id: string;
		name: string;
		source: 'local' | 'off';
		imageUrl: string | null;
	};

	let searchTerm = $state('');
	let results = $state<SearchResult[]>([]);
	let isLoading = $state(false);
	let searchAttempted = $state(false);

	$effect(() => {
		let eventSource: EventSource | null = null;

		// Se activa cuando el término de búsqueda cambia
		if (searchTerm.length < 3) {
			results = [];
			searchAttempted = false;
			isLoading = false;
		} else {
			results = [];
			isLoading = true;
			searchAttempted = true;

			eventSource = new EventSource(`/api/ingredients/search?q=${encodeURIComponent(searchTerm)}`);

			eventSource.addEventListener('message', (event) => {
				const newResults = JSON.parse(event.data);
				results = [...results, ...newResults];
			});

			eventSource.addEventListener('stream_error', (event) => {
				const errorData = JSON.parse((event as MessageEvent).data);
				console.error('Error de stream recibido:', errorData);
			});

			eventSource.onerror = (err) => {
				console.error('Error en la conexión de EventSource:', err);
				isLoading = false;
				eventSource?.close();
			};

			eventSource.addEventListener('close', () => {
				isLoading = false;
				eventSource?.close();
			});
		}

		// Función de limpieza que se ejecuta cuando el efecto se reinicia
		return () => {
			eventSource?.close();
		};
	});
</script>

<div class="space-y-8 p-4 md:p-8">
	<div class="flex justify-between items-center">
		<h1 class="text-2xl font-bold">Añadir Ingredientes desde Open Food Facts</h1>
		<a href="/admin/ingredientes" class={buttonVariants({ variant: 'outline' })}>
			Volver al listado
		</a>
	</div>

	<div class="flex items-center gap-2">
		<Input
			bind:value={searchTerm}
			placeholder="Buscar por nombre (ej. tomate frito)..."
			class="flex-grow"
		/>
		{#if isLoading}
			<p class="text-sm text-gray-500">Buscando...</p>
		{/if}
	</div>

	{#if results.length > 0}
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
								<form method="POST" action="?/add">
									<input type="hidden" name="productId" value={result.id} />
									<Button type="submit" class="w-full">Añadir</Button>
								</form>
							{:else}
								<Button class="w-full" disabled>Añadido</Button>
							{/if}
						</CardContent>
					</Card>
				</div>
			{/each}
		</div>
	{:else if !isLoading && searchAttempted}
		<div class="text-center text-gray-500 py-8">
			<p>No se encontraron resultados para tu búsqueda.</p>
		</div>
	{/if}
</div>

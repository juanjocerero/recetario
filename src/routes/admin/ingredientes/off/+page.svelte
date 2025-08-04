<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	
	type SearchResult = {
		id: string;
		name: string;
		source: 'local' | 'off';
		imageUrl: string | null;
	};
	
	let searchTerm = '';
	let results: SearchResult[] = [];
	let isLoading = false;
	let searchAttempted = false; // Para mostrar el mensaje de "no resultados"
	let eventSource: EventSource | null = null;

	function handleSearch() {
		if (searchTerm.length < 3) {
			results = [];
			searchAttempted = false;
			return;
		}

		results = [];
		isLoading = true;
		searchAttempted = true;

		if (eventSource) {
			eventSource.close();
		}

		eventSource = new EventSource(`/api/ingredients/search?q=${encodeURIComponent(searchTerm)}`);

		eventSource.addEventListener('message', (event) => {
			const newResults = JSON.parse(event.data);
			results = [...results, ...newResults];
		});

		// Escucha los errores de aplicación enviados explícitamente por el servidor
		eventSource.addEventListener('stream_error', (event) => {
			// Este es un MessageEvent, por lo que podemos castearlo y leer `data`
			const errorData = JSON.parse((event as MessageEvent).data);
			console.error('Error de stream recibido:', errorData);
		});

		// Escucha los errores de conexión genéricos
		eventSource.onerror = (err) => {
			// Este es un Event genérico, no tiene `data`. Solo indica fallo en la conexión.
			console.error('Error en la conexión de EventSource. La conexión se ha cerrado.', err);
			isLoading = false;
			eventSource?.close();
		};
		
		eventSource.addEventListener('close', () => {
			isLoading = false;
			eventSource?.close();
		});
	}
</script>

<div class="space-y-8 p-4 md:p-8">
	<div class="flex justify-between items-center">
		<h1 class="text-2xl font-bold">Añadir Ingredientes desde Open Food Facts</h1>
		<a href="/admin/ingredientes" class={buttonVariants({ variant: 'outline' })}>
			Volver al listado
		</a>
	</div>
	
	<form on:submit|preventDefault={handleSearch} class="flex items-center gap-2">
		<Input
		bind:value={searchTerm}
		placeholder="Buscar por nombre (ej. tomate frito)..."
		class="flex-grow"
		/>
		<Button type="submit" disabled={isLoading}>
			{#if isLoading}Buscando...{:else}Buscar{/if}
		</Button>
	</form>
	
	{#if results.length > 0}
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
		{#each results as result (result.id)}
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
					<Button type="submit" class="w-full">Añadir a la Base de Datos</Button>
				</form>
				{:else}
				<Button class="w-full" disabled>Ya está en la Base de Datos</Button>
				{/if}
			</CardContent>
		</Card>
		{/each}
	</div>
	{:else if !isLoading && searchAttempted}
	<div class="text-center text-gray-500 py-8">
		<p>No se encontraron resultados para tu búsqueda.</p>
	</div>
	{/if}
</div>

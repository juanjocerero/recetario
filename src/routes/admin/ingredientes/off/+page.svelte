<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	
	type SearchResult = {
		id: string;
		name: string;
		source: 'local' | 'off';
		imageUrl: string | null;
	};
	
	let searchTerm = '';
	let results: SearchResult[] = [];
	let isLoading = false;
	
	async function handleSearch() {
		if (searchTerm.length < 3) {
			results = [];
			return;
		}
		isLoading = true;
		try {
			const response = await fetch(`/api/ingredients/search?q=${encodeURIComponent(searchTerm)}`);
			if (response.ok) {
				results = await response.json();
			}
		} catch (error) {
			console.error('Error en la búsqueda:', error);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="space-y-8 p-4 md:p-8">
	<h1 class="text-2xl font-bold">Añadir Ingredientes desde Open Food Facts</h1>
	
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
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each results as result (result.id)}
		<Card>
			<CardHeader>
				<img
				src={result.imageUrl || 'https://placehold.co/400x400?text=Sin+Imagen'}
				alt={result.name}
				class="aspect-square w-full rounded-md object-cover"
				/>
			</CardHeader>
			<CardContent class="flex flex-col justify-between space-y-4">
				<CardTitle class="text-base">{result.name}</CardTitle>
				<CardDescription>
					ID: {result.id} <br />
					Origen: <span class="font-semibold">{result.source === 'off' ? 'Open Food Facts' : 'Local'}</span>
				</CardDescription>
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
	{/if}
</div>

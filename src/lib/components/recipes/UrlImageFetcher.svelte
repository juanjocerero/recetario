<!-- Ruta: src/lib/components/recipes/UrlImageFetcher.svelte -->
<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Trash2, Loader, CheckCircle2, TriangleAlert } from 'lucide-svelte';

	type $Props = {
		urls: string[];
		imageUrl: string;
	};

	let { urls = $bindable(), imageUrl = $bindable() }: $Props = $props();

	// Estado para cada URL individual
	let urlStates = $state(
		urls.map(() => ({
			status: 'idle' as 'idle' | 'loading' | 'success' | 'error',
			message: ''
		}))
	);

	function addUrlField() {
		urls.push('');
		urlStates.push({ status: 'idle', message: '' });
	}

	function removeUrlField(index: number) {
		urls.splice(index, 1);
		urlStates.splice(index, 1);
	}

	// Justificación (Paso 3): Esta función se dispara cuando el usuario deja de editar
	// un campo de URL. Llama a nuestro endpoint de scraping y actualiza el estado
	// de esa URL específica para mostrar feedback (spinner, tick, error).
	async function handleUrlBlur(index: number) {
		const url = urls[index];
		if (!url || !url.startsWith('http')) {
			urlStates[index] = { status: 'idle', message: '' };
			return;
		}

		// Solo buscamos imagen si no hay ya una imagen principal definida.
		if (imageUrl) return;

		urlStates[index] = { status: 'loading', message: '' };

		try {
			const response = await fetch('/api/scrape-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Error desconocido');
			}

			const data = await response.json();
			imageUrl = data.imageUrl; // Actualizamos la imagen principal de la receta
			urlStates[index] = { status: 'success', message: 'Imagen encontrada' };
		} catch (error) {
			urlStates[index] = {
				status: 'error',
				message: error instanceof Error ? error.message : 'No se pudo obtener la imagen'
			};
		}
	}
</script>

<div class="space-y-2">
	{#each urls as _, i}
		<div class="flex items-center gap-2">
			<div class="relative flex-grow">
				<Input
					type="url"
					placeholder="https://ejemplo.com/receta"
					bind:value={urls[i]}
					onblur={() => handleUrlBlur(i)}
					class="pr-10"
				/>
				<div class="absolute inset-y-0 right-0 flex items-center pr-3">
					{#if urlStates[i]?.status === 'loading'}
						<Loader class="h-5 w-5 animate-spin text-gray-400" />
					{:else if urlStates[i]?.status === 'success'}
						<CheckCircle2 class="h-5 w-5 text-green-500" />
					{:else if urlStates[i]?.status === 'error'}
						<TriangleAlert class="h-5 w-5 text-red-500" />
					{/if}
				</div>
			</div>
			<Button type="button" variant="ghost" size="icon" onclick={() => removeUrlField(i)}>
				<Trash2 class="h-4 w-4" />
			</Button>
		</div>
		{#if urlStates[i]?.status === 'error'}
			<p class="text-sm text-red-500 ml-1">{urlStates[i].message}</p>
		{/if}
	{/each}
	<Button type="button" variant="outline" size="sm" onclick={addUrlField}>
		Añadir URL
	</Button>
</div>

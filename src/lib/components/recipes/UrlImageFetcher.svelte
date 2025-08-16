<!-- Ruta: src/lib/components/recipes/UrlImageFetcher.svelte -->
<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Trash2, Loader, BadgeCheck, TriangleAlert } from 'lucide-svelte';

	import { scrapeImageFromPage } from '$lib/client/api';

	type UrlState = {
		status: 'idle' | 'loading' | 'success' | 'error';
		message: string;
	};

	let { urls = $bindable(), imageUrl = $bindable() } = $props<{
		urls?: string[];
		imageUrl?: string | null;
	}>();

	let urlStates: UrlState[] = $state([]);

	$effect(() => {
		// Sincroniza el estado interno cuando las URLs externas cambian
		const newStates = (urls ?? []).map((_: string, i: number) => {
			return urlStates[i] ?? { status: 'idle', message: '' };
		});
		if (JSON.stringify(newStates) !== JSON.stringify(urlStates)) {
			urlStates = newStates;
		}
	});

	function addUrlField() {
		if (urls) {
			urls.push('');
			urls = urls; // Notifica el cambio
			urlStates.push({ status: 'idle', message: '' });
		}
	}

	function removeUrlField(index: number) {
		if (urls) {
			urls.splice(index, 1);
			urls = urls; // Notifica el cambio
			urlStates.splice(index, 1);
		}
	}

	async function handleUrlBlur(index: number) {
		const url = urls?.[index];
		if (!url || !url.startsWith('http')) {
			urlStates[index] = { status: 'idle', message: '' };
			return;
		}

		if (imageUrl) return;

		urlStates[index] = { status: 'loading', message: '' };

		try {
			imageUrl = await scrapeImageFromPage(url);
			urlStates[index] = { status: 'success', message: 'Imagen encontrada' };
		} catch (err) {
			urlStates[index] = {
				status: 'error',
				message: err instanceof Error ? err.message : 'No se pudo obtener la imagen'
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
			placeholder="https://recetas.juanjocerero.es/receta"
			bind:value={urls[i]}
			onblur={() => handleUrlBlur(i)}
			class="pr-10"
			/>
			<div class="absolute inset-y-0 right-0 flex items-center pr-3">
				{#if urlStates[i]?.status === 'loading'}
				<Loader class="h-5 w-5 animate-spin text-gray-400" />
				{:else if urlStates[i]?.status === 'success'}
				<BadgeCheck class="h-5 w-5 text-green-500" />
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

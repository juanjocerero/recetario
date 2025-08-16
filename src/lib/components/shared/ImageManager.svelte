<!-- src/lib/components/shared/ImageManager.svelte -->
<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { LoaderCircle } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { useDebounce } from '$lib/runes/useDebounce.svelte';
	
	let {
		imageUrl = $bindable<string | null>(),
			inputName = 'imageUrl'
		} = $props<{ imageUrl: string | null; inputName?: string }>();
		
		let remoteUrl = $state('');
		let isLoading = $state(false);
		const debouncedUrl = useDebounce(() => remoteUrl, 500);
		
		function handleImageUpload(event: Event) {
			const target = event.target as HTMLInputElement;
			const file = target.files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const result = e.target?.result;
					imageUrl = typeof result === 'string' ? result : null;
				};
				reader.readAsDataURL(file);
			}
		}
		
		$effect(() => {
			const urlToFetch = debouncedUrl();
			if (!urlToFetch || !urlToFetch.startsWith('http')) {
				return;
			}
			
			const fetchImage = async () => {
				isLoading = true;
				const toastId = toast.loading('Buscando imagen en la URL...', { duration: 2000 });
				
				try {
					const response = await fetch('/api/scrape-image', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ url: urlToFetch })
					});
					
					if (!response.ok) {
						const errorData = await response.json();
						throw new Error(errorData.message || `Error ${response.status}`);
					}
					
					const data = await response.json();
					imageUrl = data.imageUrl;
					toast.success('Imagen encontrada y asignada.', { id: toastId, duration: 2000 });
				} catch (error: any) {
					toast.error(error.message || 'No se pudo obtener la imagen.', { id: toastId, duration: 2000 });
					imageUrl = null; // Limpiar si falla
				} finally {
					isLoading = false;
				}
			};
			
			fetchImage();
		});
	</script>
	
	<div class="space-y-4 rounded-lg border p-4">
		<input type="hidden" name={inputName} value={imageUrl ?? ''} />
		
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="md:col-span-1">
				<Label>Previsualización</Label>
				<div
				class="mt-2 flex h-32 w-full items-center justify-center rounded-md border bg-muted/50 text-sm text-muted-foreground"
				>
				{#if imageUrl}
				<img
				src={imageUrl}
				alt="Previsualización"
				class="h-full w-full rounded-md object-cover"
				/>
				{:else}
				Sin imagen
				{/if}
			</div>
		</div>
		
		<div class="space-y-4 md:col-span-2">
			<div>
				<Label for="image-upload">Subir un archivo</Label>
				<Input id="image-upload" type="file" onchange={handleImageUpload} accept="image/*" />
			</div>
			
			<div class="relative">
				<Label for="image-url">O pegar URL de una imagen</Label>
				<div class="relative flex items-center">
					<Input
					id="image-url"
					type="url"
					placeholder="https://ejemplo.com/imagen.jpg"
					bind:value={remoteUrl}
					class="pr-10"
					/>
					{#if isLoading}
					<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
						<LoaderCircle class="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

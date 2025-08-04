<script lang="ts">
	import { browser } from '$app/environment';
	import { themeStore } from '$lib/stores/theme.svelte';
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import type { Snippet } from 'svelte';
	import { Wrench } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let { children }: { children: Snippet } = $props();

	// Este único $effect, que se ejecuta en el contexto correcto de un componente,
	// gestiona todos los efectos secundarios relacionados con el tema.
	$effect(() => {
		if (!browser) return;

		const currentTheme = themeStore.value;

		// 1. Persiste la elección del usuario en localStorage.
		localStorage.setItem('theme', currentTheme);

		// 2. Función para aplicar la clase 'dark' al <html>.
		const applyTheme = () => {
			const themeToApply =
				currentTheme === 'system'
					? window.matchMedia('(prefers-color-scheme: dark)').matches
						? 'dark'
						: 'light'
					: currentTheme;
			document.documentElement.classList.toggle('dark', themeToApply === 'dark');
		};

		applyTheme();

		// 3. Escucha los cambios en la preferencia del sistema operativo.
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const systemThemeListener = () => {
			if (currentTheme === 'system') {
				applyTheme();
			}
		};
		mediaQuery.addEventListener('change', systemThemeListener);

		// 4. La función de limpieza se ejecuta cuando el efecto se reinicia
		//    o el componente se destruye, evitando fugas de memoria.
		return () => {
			mediaQuery.removeEventListener('change', systemThemeListener);
		};
	});
</script>

<Tooltip.Provider>
	<div class="min-h-screen bg-background font-sans text-foreground antialiased">
		<div class="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-4">
			<a
				href="/admin/ingredientes"
				class="inline-flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
				aria-label="Administrar ingredientes"
			>
				<Wrench class="h-[1.2rem] w-[1.2rem]" />
			</a>
			<ThemeToggle />
		</div>
		{@render children()}
	</div>
</Tooltip.Provider>
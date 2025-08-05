<script lang="ts">
	import { browser } from '$app/environment';
	import { themeStore } from '$lib/stores/theme.svelte';
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import type { Snippet } from 'svelte';
	import { Wrench, LogOut, LogIn } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Toaster, toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';

	let { children, data }: { children: Snippet; data: any } = $props();

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

	$effect(() => {
		if (data.flash) {
			toast.success(data.flash);
		}
	});
</script>

<Tooltip.Provider>
	<div class="min-h-screen bg-background font-sans text-foreground antialiased">
		<div class="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-4">
			{#if data.user}
				{#if data.user.isAdmin}
					<form
						action="/?/logout"
						method="POST"
						use:enhance={() => {
							const toastId = toast.loading('Cerrando sesión...');
							return async ({ update }) => {
								await update();
								toast.success('Sesión cerrada correctamente.', { id: toastId });
							};
						}}
					>
						<Tooltip.Root>
							<Tooltip.Trigger
								type="submit"
								class={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
								aria-label="Cerrar sesión"
							>
								<LogOut class="h-[1.2rem] w-[1.2rem]" />
							</Tooltip.Trigger>
							<Tooltip.Content>
								<p>Cerrar sesión</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</form>

					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<a
									href="/admin/ingredientes"
									class={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
									aria-label="Administrar ingredientes"
									{...props}
								>
									<Wrench class="h-[1.2rem] w-[1.2rem]" />
								</a>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Administrar ingredientes</p>
						</Tooltip.Content>
					</Tooltip.Root>
				{/if}
			{:else}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<a
								href="/login"
								class={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
								aria-label="Iniciar sesión"
								{...props}
							>
								<LogIn class="h-[1.2rem] w-[1.2rem]" />
							</a>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Iniciar sesión</p>
					</Tooltip.Content>
				</Tooltip.Root>
			{/if}
			<ThemeToggle />
		</div>
		{@render children()}
		<Toaster richColors closeButton />
	</div>
</Tooltip.Provider>

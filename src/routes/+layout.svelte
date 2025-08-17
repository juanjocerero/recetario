<!--
Fichero: src/routes/+layout.svelte
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { themeStore } from '$lib/stores/theme.svelte';
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import type { Snippet } from 'svelte';
	import { Utensils, LogOut, LogIn, Menu, ChefHat, NotebookPen } from 'lucide-svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Toaster, toast } from 'svelte-sonner';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { invalidateAll, goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();
	let isMenuOpen = $state(false);

	// --- METADATOS DINÁMICOS Y REACTIVOS ---
	const defaultTitle = 'Recetas de Cerero';
	const defaultDescription = 'Un recetario y dietario personal.';
	const siteUrl = 'https://recetas.juanjocerero.es';
	const defaultOgImage = new URL('/android-chrome-512x512.png', siteUrl).href;

	const recipe = $derived($page.data.recipe);

	const title = $derived(recipe?.title ? `${recipe.title} | Recetas de Cerero` : defaultTitle);
	const description = $derived(
		recipe?.title
			? `Información nutricional, ingredientes y pasos para preparar ${recipe.title}`
			: defaultDescription
	);
	const ogType = $derived(recipe ? 'article' : 'website');
	const ogUrl = $derived($page.data.urlHref || siteUrl);
	const ogImage = $derived(
		recipe?.imageUrl ? new URL(recipe.imageUrl, $page.data.urlHref || siteUrl).href : defaultOgImage
	);

	// --- Efectos del Tema ---
	$effect(() => {
		if (!browser) return;
		const currentTheme = themeStore.value;
		localStorage.setItem('theme', currentTheme);
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
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', applyTheme);
		return () => mediaQuery.removeEventListener('change', applyTheme);
	});

	async function handleLogout() {
		const toastId = toast.loading('Cerrando sesión...', { duration: 2000 });
		try {
			await authClient.signOut();
			await invalidateAll();
			toast.success('Sesión cerrada correctamente.', { id: toastId, duration: 2000 });
			isMenuOpen = false;
		} catch (error) {
			let description = 'Ocurrió un error inesperado.';
			if (error instanceof Error) {
				description = error.message;
			}
			toast.error('Error al cerrar sesión', { id: toastId, description, duration: 5000 });
		}
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={ogType} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:url" content={ogUrl} />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<div class="min-h-screen bg-background font-sans text-foreground antialiased">
	<div class="fixed top-4 left-4 z-50">
		<Popover.Root bind:open={isMenuOpen}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<button
						{...props}
						class={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
						aria-label="Abrir menú"
					>
						<Menu class="h-[1.2rem] w-[1.2rem]" />
					</button>
				{/snippet}
			</Popover.Trigger>

			<Popover.Content
				class="w-auto p-2"
				onOpenAutoFocus={(e) => {
					e.preventDefault();
				}}
			>
				<div class="flex flex-col items-center gap-2">
					<!-- Acción: Inicio -->
					<Button
						variant="ghost"
						size="icon"
						title="Ir a Inicio"
						aria-label="Ir a la página de inicio"
						onclick={() => {
							goto('/');
							isMenuOpen = false;
						}}
					>
						<ChefHat class="h-[1.2rem] w-[1.2rem]" />
					</Button>

					{#if data.user}
						<!-- Acción: Diario (para todos los usuarios logueados) -->
						<Button
							variant="ghost"
							size="icon"
							title="Ir al Diario"
							aria-label="Ir al Diario de Consumo"
							onclick={() => {
								goto('/diario');
								isMenuOpen = false;
							}}
						>
							<NotebookPen class="h-[1.2rem] w-[1.2rem]" />
						</Button>

						{#if data.user.role === 'admin'}
							<!-- Para el botón de Administrar Productos -->
							<Button
								variant="ghost"
								size="icon"
								title="Administrar productos"
								aria-label="Administrar productos"
								onclick={() => {
									goto('/admin/products');
									isMenuOpen = false;
								}}
							>
								<Utensils class="h-[1.2rem] w-[1.2rem]" />
							</Button>
						{/if}

						<!-- Acción: Cerrar Sesión -->
						<Button
							onclick={handleLogout}
							variant="ghost"
							size="icon"
							title="Cerrar sesión"
							aria-label="Cerrar sesión"
						>
							<LogOut class="h-[1.2rem] w-[1.2rem]" />
						</Button>
					{:else}
						<!-- Acción: Iniciar Sesión -->
						<Button
							variant="ghost"
							size="icon"
							aria-label="Iniciar sesión"
							title="Iniciar sesión"
							onclick={() => {
								goto('/login');
								isMenuOpen = false;
							}}
						>
							<LogIn class="h-[1.2rem] w-[1.2rem]" />
						</Button>
					{/if}
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>

	<div class="fixed bottom-4 left-4 z-50">
		<ThemeToggle />
	</div>

	{#key $page.url.pathname}
		<div transition:fade={{ duration: 200 }}>
			{@render children()}
		</div>
	{/key}

	<Toaster richColors closeButton />
</div>

<script lang="ts">
	import { browser } from '$app/environment';
	import { themeStore } from '$lib/stores/theme.svelte';
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import type { Snippet } from 'svelte';
	import { Wrench, LogOut, LogIn, Menu, House } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Popover from '$lib/components/ui/popover';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Toaster, toast } from 'svelte-sonner';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { invalidateAll, goto } from '$app/navigation';

	let { children, data }: { children: Snippet; data: any } = $props();
	let isMenuOpen = $state(false);

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

	// --- Efecto para Flash Messages ---
	$effect(() => {
		if (data.flash) {
			toast.success(data.flash);
		}
	});
</script>

<Tooltip.Provider delayDuration={100}>
	<div class="min-h-screen bg-background font-sans text-foreground antialiased">
		<div class="fixed top-4 left-4 z-50">
			<Popover.Root bind:open={isMenuOpen}>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Popover.Trigger class={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}>
							<Menu class="h-[1.2rem] w-[1.2rem]" />
						</Popover.Trigger>
					</Tooltip.Trigger>
					<Tooltip.Content side="right">
						<p>Menú</p>
					</Tooltip.Content>
				</Tooltip.Root>
				<Popover.Content
					class="w-auto p-2"
					onOpenAutoFocus={(e) => {
						e.preventDefault();
					}}
				>
					<div class="flex flex-col items-center gap-2">
						<!-- Acción: Inicio -->
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant="ghost"
									size="icon"
									aria-label="Ir a la página de inicio"
									onclick={() => {
										goto('/');
										isMenuOpen = false;
									}}
								>
									<House class="h-[1.2rem] w-[1.2rem]" />
								</Button>
							</Tooltip.Trigger>
							<Tooltip.Content side="right">
								<p>Inicio</p>
							</Tooltip.Content>
						</Tooltip.Root>

						{#if data.user}
							{#if data.user.isAdmin}
								<!-- Acción: Administrar -->
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button
											variant="ghost"
											size="icon"
											aria-label="Administrar ingredientes"
											onclick={() => {
												goto('/admin/ingredientes');
												isMenuOpen = false;
											}}
										>
											<Wrench class="h-[1.2rem] w-[1.2rem]" />
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content side="right">
										<p>Administrar</p>
									</Tooltip.Content>
								</Tooltip.Root>

								<!-- Acción: Cerrar Sesión -->
								<form
									action="/login?/logout"
									method="POST"
									use:enhance={() => {
										const toastId = toast.loading('Cerrando sesión...');
										return async ({ update }) => {
											await update();
											await invalidateAll();
											toast.success('Sesión cerrada correctamente.', { id: toastId });
										};
									}}
								>
									<Tooltip.Root>
										<Tooltip.Trigger>
											<Button
												type="submit"
												variant="ghost"
												size="icon"
												class="w-full"
												aria-label="Cerrar sesión"
												onclick={() => (isMenuOpen = false)}
											>
												<LogOut class="h-[1.2rem] w-[1.2rem]" />
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content side="right">
											<p>Cerrar sesión</p>
										</Tooltip.Content>
									</Tooltip.Root>
								</form>
							{/if}
						{:else}
							<!-- Acción: Iniciar Sesión -->
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button
										variant="ghost"
										size="icon"
										aria-label="Iniciar sesión"
										onclick={() => {
											goto('/login');
											isMenuOpen = false;
										}}
									>
										<LogIn class="h-[1.2rem] w-[1.2rem]" />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content side="right">
									<p>Iniciar sesión</p>
								</Tooltip.Content>
							</Tooltip.Root>
						{/if}
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>

		<div class="fixed bottom-4 left-4 z-50">
			<Tooltip.Root>
				<Tooltip.Trigger>
					<ThemeToggle />
				</Tooltip.Trigger>
				<Tooltip.Content side="top">
					<p>Cambiar tema</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</div>

		{#key page.url.pathname}
			<div transition:fade={{ duration: 200 }}>
				{@render children()}
			</div>
		{/key}
		<Toaster richColors closeButton />
	</div>
</Tooltip.Provider>

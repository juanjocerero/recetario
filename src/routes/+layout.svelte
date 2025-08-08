<!--
// Fichero: src/routes/+layout.svelte - VERSIÓN SIMPLIFICADA PARA PRUEBA
-->
<script lang="ts">
    import { browser } from '$app/environment';
    import { themeStore } from '$lib/stores/theme.svelte';
    import '../app.css';
    import ThemeToggle from '$lib/components/ThemeToggle.svelte';
    import type { Snippet } from 'svelte';
    import { Wrench, LogOut, LogIn, Menu, House } from 'lucide-svelte';
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
                        <House class="h-[1.2rem] w-[1.2rem]" />
                    </Button>
                    
                    {#if data.user}
                        {#if data.user.isAdmin}
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
                                <Wrench class="h-[1.2rem] w-[1.2rem]" />
                            </Button>
                            
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
                                <Button
                                    type="submit"
                                    variant="ghost"
                                    size="icon"
																		title="Cerrar sesión"
                                    aria-label="Cerrar sesión"
                                >
                                    <LogOut class="h-[1.2rem] w-[1.2rem]" />
                                </Button>
                            </form>
                        {/if}
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
    
    {#key page.url.pathname}
        <div transition:fade={{ duration: 200 }}>
            {@render children()}
        </div>
    {/key}
    
    <Toaster richColors closeButton />
</div>
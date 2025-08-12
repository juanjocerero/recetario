<!-- Ruta: src/lib/components/ThemeToggle.svelte - VERSIÓN CON POPOVER -->
<script lang="ts">
    import { Sun, Moon, SunMoon } from 'lucide-svelte';
    import * as Popover from '$lib/components/ui/popover';
    import { themeStore } from '$lib/stores/theme.svelte';
    import { buttonVariants, type ButtonVariant } from '$lib/components/ui/button';
    import { cn } from '$lib/utils';
    
    let { variant = 'outline' }: { variant?: ButtonVariant } = $props();
    let isOpen = $state(false);
</script>

<Popover.Root bind:open={isOpen}>
    <Popover.Trigger>
        {#snippet child({ props })}
        <button
        {...props}
        class={cn(buttonVariants({ variant, size: 'icon' }))}
        aria-label="Cambiar tema"
        >
        <Sun class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span class="sr-only">Cambiar tema</span>
    </button>
    {/snippet}
</Popover.Trigger>

<Popover.Content 
align="start"      
side="top"         
sideOffset={8}     
class="w-fit p-1"  
style="min-width: unset !important;"
>
<div class="flex flex-col gap-1">
    <button
    class="w-8 h-8 flex items-center justify-center hover:bg-accent rounded transition-colors"
    onclick={() => {
        themeStore.set('light');
        isOpen = false;
    }}
    aria-label="Tema claro"
    >
    <Sun class="h-4 w-4" />
</button>
<button
class="w-8 h-8 flex items-center justify-center hover:bg-accent rounded transition-colors"
onclick={() => {
    themeStore.set('dark');
    isOpen = false;
}}
aria-label="Tema oscuro"
>
<Moon class="h-4 w-4" />
</button>
<button
class="w-8 h-8 flex items-center justify-center hover:bg-accent rounded transition-colors"
onclick={() => {
    themeStore.set('system');
    isOpen = false;
}}
aria-label="Tema del sistema"
>
<SunMoon class="h-4 w-4" />
</button>
</div>
</Popover.Content>
</Popover.Root>
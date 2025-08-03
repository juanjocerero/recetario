<!--
// Ruta: src/lib/components/ThemeToggle.svelte
// Implementación moderna para Svelte 5, usando composición directa y clases
// en el Trigger para imitar un Button, alineado con las nuevas prácticas de bits-ui.
-->
<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { themeStore } from '$lib/stores/theme.svelte';

	// Clases extraídas de buttonVariants para variant="outline" y size="icon"
	const triggerClasses =
		"focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border size-9";
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class={triggerClasses} aria-label="Toggle theme">
		<Sun
			class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
		/>
		<Moon
			class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
		/>
		<span class="sr-only">Toggle theme</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item onclick={() => themeStore.set('light')}>Light</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => themeStore.set('dark')}>Dark</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => themeStore.set('system')}>System</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!--
// Ruta: src/lib/components/ThemeToggle.svelte
// VERSIÓN 7: Composición correcta y definitiva usando `asChild` en el Trigger padre.
-->
<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { buttonVariants, type ButtonVariant } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	let { variant = 'outline' }: { variant?: ButtonVariant } = $props();
</script>

<DropdownMenu.Root>
	<Tooltip.Root>
		<DropdownMenu.Trigger>
			<Tooltip.Trigger
				class={cn(buttonVariants({ variant, size: 'icon' }))}
				aria-label="Toggle theme"
			>
				<Sun
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<Moon
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</Tooltip.Trigger>
		</DropdownMenu.Trigger>
		<Tooltip.Content>
			<p>Cambiar tema</p>
		</Tooltip.Content>
	</Tooltip.Root>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item onclick={() => themeStore.set('light')}>Light</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => themeStore.set('dark')}>Dark</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => themeStore.set('system')}>System</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
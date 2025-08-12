<!-- Ruta: src/lib/components/shared/DatePicker.svelte -->
<script lang="ts">
	import { Calendar as CalendarIcon } from 'lucide-svelte';
	import {
		DateFormatter,
		getLocalTimeZone,
		type DateValue,
		today
	} from '@internationalized/date';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Popover from '$lib/components/ui/popover';
	
	type Props = {
		value?: DateValue | undefined;
	};
	
	let { value: date = $bindable(today(getLocalTimeZone())) }: Props = $props();
	
	const df = new DateFormatter('es-ES', {
		dateStyle: 'long'
	});
</script>

<Popover.Root>
	<Popover.Trigger
	class={cn(
		buttonVariants({ variant: 'outline' }),
		'w-full justify-start text-left font-normal',
		!date && 'text-muted-foreground'
		)}
		>
		<CalendarIcon class="mr-2 h-4 w-4" />
		{date ? df.format(date.toDate(getLocalTimeZone())) : 'Selecciona una fecha'}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0">
		<Calendar bind:value={date} type="single" initialFocus />
	</Popover.Content>
</Popover.Root>

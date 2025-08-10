<!-- Ruta: src/routes/diario/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import { RangeCalendar } from '$lib/components/ui/range-calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Calendar as CalendarIcon } from 'lucide-svelte';
	import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date';
	import { cn, calculateAggregatedNutrients } from '$lib/utils.js';
	import type { DateRange } from 'bits-ui';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import NutritionalSummary from '$lib/components/diary/NutritionalSummary.svelte';
	import DiaryEntryList from '$lib/components/diary/DiaryEntryList.svelte';
	import AddItemPanel from '$lib/components/diary/AddItemPanel.svelte';
	import type { DiaryEntry, Product } from '@prisma/client';
	import type { FullRecipe } from '$lib/models/recipe';
	import { calculateNutritionalInfo } from '$lib/recipeCalculator';
	import type { NewDiaryEntryData } from '$lib/server/services/diaryService';

	type SearchResult = (Product & { type: 'PRODUCT' }) | (FullRecipe & { type: 'RECIPE' });

	let { data: initialData }: { data: PageData } = $props();

	let entries = $state<DiaryEntry[]>(initialData.entries);
	let isLoading = $state(false);

	const df = new DateFormatter('es-ES', {
		dateStyle: 'long'
	});

	let value: DateRange | undefined = $state({
		start: today(getLocalTimeZone()),
		end: today(getLocalTimeZone())
	});

	let aggregatedNutrients = $derived(calculateAggregatedNutrients(entries));

	let selectedDays = $derived(
		value?.end && value.start
			? Math.round((value.end.toDate(getLocalTimeZone()).getTime() - value.start.toDate(getLocalTimeZone()).getTime()) / (1000 * 60 * 60 * 24)) + 1
			: 1
	);

	async function fetchEntries(range: DateRange | undefined) {
		if (!range?.start) return;

		isLoading = true;
		const start = range.start.toDate(getLocalTimeZone());
		const end = range.end?.toDate(getLocalTimeZone()) ?? start;

		const startDateStr = start.toISOString().split('T')[0];
		const endDateStr = end.toISOString().split('T')[0];

		const apiUrl = `/api/diary/${startDateStr}/${endDateStr}`;

		try {
			const response = await fetch(apiUrl);
			if (response.ok) {
				entries = await response.json();
			} else {
				console.error('[Frontend] Error fetching entries:', await response.text());
				entries = [];
			}
		} catch (error) {
			console.error('[Frontend] Fetch error:', error);
			entries = [];
		} finally {
			isLoading = false;
		}
	}

	async function handleAddItem(item: SearchResult) {
		const selectedDate = value?.start?.toDate(getLocalTimeZone());
		if (!selectedDate) {
			// No debería ocurrir si el calendario siempre tiene un valor, pero es una buena guarda.
			console.error('No hay una fecha seleccionada para añadir la entrada.');
			return;
		}

		let newEntryData: Omit<NewDiaryEntryData, 'userId'>;

		if (item.type === 'PRODUCT') {
			newEntryData = {
				date: selectedDate,
				type: 'PRODUCT',
				name: item.name,
				quantity: 100, // Cantidad por defecto
				calories: item.calories,
				protein: item.protein,
				fat: item.fat,
				carbs: item.carbs,
				baseProductId: item.id
			};
		} else {
			// Es una receta
			const recipeIngredients = item.ingredients.map((ing) => ({
				quantity: ing.quantity,
				calories: ing.product.calories,
				protein: ing.product.protein,
				fat: ing.product.fat,
				carbs: ing.product.carbs
			}));
			const totals = calculateNutritionalInfo(recipeIngredients);

			newEntryData = {
				date: selectedDate,
				type: 'RECIPE',
				name: item.title,
				quantity: recipeIngredients.reduce((sum, ing) => sum + ing.quantity, 0),
				calories: totals.totalCalories,
				protein: totals.totalProtein,
				fat: totals.totalFat,
				carbs: totals.totalCarbs,
				ingredients: item.ingredients.map((ing) => ({
					id: ing.product.id,
					name: ing.product.name,
					quantity: ing.quantity,
					baseValues: {
						calories: ing.product.calories,
						protein: ing.product.protein,
						fat: ing.product.fat,
						carbs: ing.product.carbs
					}
				})) as any, // Cast a 'any' para evitar problemas con el tipo JSON
				baseRecipeId: item.id
			};
		}

		try {
			const response = await fetch('/api/diary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newEntryData)
			});

			if (response.ok) {
				const savedEntry = await response.json();
				entries.push(savedEntry);
				entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
			} else {
				console.error('Error al guardar la entrada:', await response.text());
			}
		} catch (error) {
			console.error('Error de red al guardar:', error);
		}
	}

	async function handleDeleteEntry(entryToDelete: DiaryEntry) {
		try {
			const response = await fetch(`/api/diary/${entryToDelete.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				entries = entries.filter((e) => e.id !== entryToDelete.id);
			} else {
				console.error('Error al eliminar la entrada:', await response.text());
			}
		} catch (error) {
			console.error('Error de red al eliminar:', error);
		}
	}

	$effect(() => {
		fetchEntries(value);
	});
</script>

<div class="container mx-auto p-4 md:py-8 md:px-24">
	<h1 class="text-3xl font-bold mb-6">Diario de Consumo</h1>

	<div class="flex flex-col lg:flex-row gap-8">
		<!-- Columna principal (2/3) -->
		<div class="lg:w-2/3 order-2 lg:order-1">
			<!-- Selector de Fecha -->
			<div class="mb-6">
				<Popover.Root>
					<Popover.Trigger
						class={cn(
							buttonVariants({ variant: 'outline' }),
							'w-[360px] justify-start text-left font-normal',
							!value && 'text-muted-foreground'
						)}
					>
						<CalendarIcon class="mr-2 h-4 w-4" />
						{#if value?.start}
							{#if value.end}
								{df.format(value.start.toDate(getLocalTimeZone()))} - {df.format(
									value.end.toDate(getLocalTimeZone())
								)}
							{:else}
								{df.format(value.start.toDate(getLocalTimeZone()))}
							{/if}
						{:else}
							<span>Selecciona un rango</span>
						{/if}
					</Popover.Trigger>
					<Popover.Content class="w-auto p-0" align="start">
						<RangeCalendar bind:value />
					</Popover.Content>
				</Popover.Root>
			</div>

			<!-- Panel de Añadir Elemento -->
			<div class="mb-6 p-4 border rounded-lg bg-card text-card-foreground">
				<AddItemPanel onAddItem={handleAddItem} />
			</div>

			<!-- Lista de entradas -->
			<div class="p-4 border rounded-lg bg-card text-card-foreground">
				<h2 class="text-xl font-semibold mb-4">Entradas del Periodo</h2>
				{#if isLoading}
					<p class="text-center text-muted-foreground py-8">Cargando...</p>
				{:else}
					<DiaryEntryList {entries} onDelete={handleDeleteEntry} />
				{/if}
			</div>
		</div>

		<!-- Columna lateral (1/3) -->
		<div class="lg:w-1/3 order-1 lg:order-2 sticky top-4">
			<NutritionalSummary
				nutrients={aggregatedNutrients}
				days={aggregatedNutrients.daysWithEntries}
			/>
		</div>
	</div>
</div>

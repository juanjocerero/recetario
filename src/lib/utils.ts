import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatInTimeZone } from 'date-fns-tz';

// Definimos un tipo genérico para las entradas del diario que funcione en cliente y servidor
type DiaryEntryLike = {
	date: Date | string;
	calories: number;
	protein: number;
	fat: number;
	carbs: number;
};

// Definimos la estructura del resultado
export type AggregatedNutrients = {
	total: {
		calories: number;
		protein: number;
		fat: number;
		carbs: number;
	};
	average: {
		calories: number;
		protein: number;
		fat: number;
		carbs: number;
	};
	daysWithEntries: number;
};

/**
* Calcula los nutrientes totales y promedio a partir de una lista de entradas del diario.
* El promedio se calcula basándose en el número de días únicos que tienen entradas.
* @param entries - Un array de objetos tipo DiaryEntryLike.
* @param timezone - El identificador de la zona horaria del usuario (ej: 'Europe/Madrid').
* @returns Un objeto con los totales, los promedios y el número de días con entradas.
*/
export function calculateAggregatedNutrients(
	entries: DiaryEntryLike[],
	timezone: string
): AggregatedNutrients {
	const totals = entries.reduce(
		(acc, entry) => {
			acc.calories += entry.calories;
			acc.protein += entry.protein;
			acc.fat += entry.fat;
			acc.carbs += entry.carbs;
			return acc;
		},
		{ calories: 0, protein: 0, fat: 0, carbs: 0 }
	);
	
	const uniqueDays = new Set(
		entries.map((e) => formatInTimeZone(new Date(e.date), timezone, 'yyyy-MM-dd'))
	);
	const daysWithEntries = uniqueDays.size > 0 ? uniqueDays.size : 1;
	
	const average = {
		calories: totals.calories / daysWithEntries,
		protein: totals.protein / daysWithEntries,
		fat: totals.fat / daysWithEntries,
		carbs: totals.carbs / daysWithEntries
	};
	
	return {
		total: totals,
		average,
		daysWithEntries
	};
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
* Normaliza un texto para búsquedas: lo convierte a minúsculas y elimina los acentos.
* Ejemplo: "Azúcar Moreno" -> "azucar moreno"
* @param text - El texto a normalizar.
* @returns El texto normalizado.
*/
export function normalizeText(text: string): string {
	return text
	.toLowerCase()
	.normalize('NFD') // Descompone los caracteres acentuados en base + diacrítico
	.replace(/[\u0300-\u036f]/g, ''); // Elimina los diacríticos
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
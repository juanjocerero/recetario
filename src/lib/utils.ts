import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };


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

/**
 * Crea una función "debounced" que retrasa la invocación de `func` hasta que `wait`
 * milisegundos han pasado desde la última vez que fue invocada.
 * @param func La función a "debounce".
 * @param wait El número de milisegundos a esperar.
 * @returns La nueva función "debounced".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | null;

	return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
		// Justificación: Desactivamos esta regla de ESLint porque en una función debounce,
		// es una práctica común y necesaria capturar el contexto 'this' para usarlo en 'apply'.
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const context = this;
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			timeout = null;
			func.apply(context, args);
		}, wait);
	};
}
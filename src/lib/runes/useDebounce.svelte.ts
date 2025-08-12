// Fichero: src/lib/runes/useDebounce.svelte.ts

/**
* Una runa de Svelte 5 personalizada que retrasa la actualización de un valor.
* @param value La señal reactiva cuyo valor se quiere retrasar.
* @param delay El tiempo de espera en milisegundos.
* @returns Una nueva señal que contiene el valor retrasado.
*/
export function useDebounce<T>(value: () => T, delay: number): () => T {
	let debouncedValue = $state(value());
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	
	$effect(() => {
		const currentValue = value();
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			debouncedValue = currentValue;
		}, delay);
		
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	});
	
	return () => debouncedValue;
}

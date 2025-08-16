import { browser } from '$app/environment';

// --- Funciones de utilidad de localStorage ---

export function hasData(key: string): boolean {
	if (!browser) return false;
	return localStorage.getItem(key) !== null;
}

export function load<T>(key: string): T | null {
	if (!browser) return null;
	const savedData = localStorage.getItem(key);
	if (!savedData) return null;
	
	try {
		return JSON.parse(savedData) as T;
	} catch (e) {
		console.error('Failed to parse autosaved data from localStorage', e);
		return null;
	}
}

function save(key: string, data: unknown): { success: boolean } {
	if (!browser) return { success: false };
	try {
		const serializedData = JSON.stringify(data);
		localStorage.setItem(key, serializedData);
		return { success: true };
	} catch (e) {
		console.error('Failed to save data to localStorage', e);
		return { success: false };
	}
}

export function clear(key: string): void {
	if (!browser) return;
	localStorage.removeItem(key);
}

// --- Rune de Autoguardado ---

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
* Creates a reactive autosave mechanism with debouncing and status feedback.
* @param key The localStorage key.
* @param data A function returning the reactive Svelte 5 state to watch.
* @param options Options like `enabled` and `isDirty` to control saving, and `debounceMs`.
*/
export function createAutosave(
	key: string,
	data: () => unknown,
	options: {
		enabled: () => boolean;
		isDirty: () => boolean;
		debounceMs?: number;
	}
) {
	const { enabled, isDirty, debounceMs = 1500 } = options;
	let status = $state<AutosaveStatus>('idle');
	let debounceTimer: number | ReturnType<typeof setTimeout> | undefined;
	let hasInitialized = false;

	$effect(() => {
		// Dependencia reactiva: se ejecuta cada vez que `data()` cambia
		const currentData = data();

		// Si no está habilitado, no hacemos nada.
		if (!enabled()) {
			// Reseteamos el flag de inicialización si se deshabilita.
			hasInitialized = false;
			return;
		}

		// La primera vez que se habilita, lo marcamos como inicializado
		// y evitamos guardar, ya que puede ser un falso positivo.
		if (!hasInitialized) {
			hasInitialized = true;
			return;
		}

		// Si no hay cambios, no hacemos nada.
		if (!isDirty()) {
			return;
		}

		// Limpiamos el timer anterior para debouncing
		clearTimeout(debounceTimer);

		status = 'saving';

		debounceTimer = setTimeout(() => {
			const { success } = save(key, currentData);
			if (success) {
				status = 'saved';
				// Volvemos a 'idle' tras un momento para que la UI pueda reaccionar
				setTimeout(() => (status = 'idle'), 2000);
			} else {
				status = 'error';
			}
		}, debounceMs);

		return () => clearTimeout(debounceTimer);
	});
	
	return {
		get status() {
			return status;
		}
	};
}
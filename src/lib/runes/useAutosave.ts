
import { browser } from '$app/environment';

/**
 * Checks if a value exists in localStorage for the given key.
 * @param key The key to check in localStorage.
 * @returns `true` if data exists, `false` otherwise.
 */
export function hasData(key: string): boolean {
	if (!browser) return false;
	return localStorage.getItem(key) !== null;
}

/**
 * Loads and deserializes data from localStorage.
 * @template T The expected type of the data.
 * @param key The key to load from localStorage.
 * @returns The deserialized data, or `null` if not found or on error.
 */
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

/**
 * Serializes and saves data to localStorage.
 * @param key The key to save the data under.
 * @param data The data to save (must be JSON-serializable).
 */
export function save(key: string, data: unknown): void {
	if (!browser) return;
	try {
		const serializedData = JSON.stringify(data);
		localStorage.setItem(key, serializedData);
	} catch (e) {
		console.error('Failed to save data to localStorage', e);
	}
}

/**
 * Removes an item from localStorage.
 * @param key The key to remove.
 */
export function clear(key: string): void {
	if (!browser) return;
	localStorage.removeItem(key);
}

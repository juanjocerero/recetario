// src/lib/stores/theme.svelte.ts
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

// Determina el tema inicial de forma segura solo en el navegador.
// En el servidor, siempre será 'system' por defecto.
const initialTheme: Theme = browser ? (localStorage.getItem('theme') as Theme) ?? 'system' : 'system';

let theme = $state<Theme>(initialTheme);

export const themeStore = {
	get value() {
		return theme;
	},
	set(newTheme: Theme) {
		theme = newTheme;
	}
};

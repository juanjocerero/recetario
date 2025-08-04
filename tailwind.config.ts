// Ruta: tailwind.config.ts
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
				heading: ['var(--font-heading)', ...defaultTheme.fontFamily.sans]
			}
		}
	},
	plugins: []
} satisfies Config;

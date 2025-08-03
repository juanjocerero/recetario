// Ruta: tailwind.config.ts
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', ...defaultTheme.fontFamily.sans],
				heading: ['Poppins', ...defaultTheme.fontFamily.sans]
			}
		}
	},
	plugins: []
} satisfies Config;

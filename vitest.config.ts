import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [svelte()],
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib')
		},
		// Justificación: Se añade la condición 'browser' para el modo de test.
		// Esto fuerza a Vite a resolver los módulos de Svelte a su versión de navegador,
		// lo que hace que las funciones de ciclo de vida como `mount` estén disponibles
		// y soluciona el error `lifecycle_function_unavailable`.
		conditions: ['browser']
	},
	test: {
		// Justificación: Se restaura 'jsdom' como entorno global, ya que la condición
		// de resolución es la solución real al problema.
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.spec.ts'],
		exclude: ['e2e/**'],
		alias: {
			$lib: path.resolve(__dirname, './src/lib'),
			'$app/environment': path.resolve(__dirname, './tests/mocks/app-environment.ts')
		}
	}
});
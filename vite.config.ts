import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

function suppressCircularDependencyWarnings(): Plugin {
  return {
    name: 'suppress-circular-warnings',
    configResolved(config) {
      const originalWarn = config.logger.warn;
      const originalInfo = config.logger.info;
      const originalConsoleWarn = console.warn;

      config.logger.warn = (msg, options) => {
        if (
          msg.includes('Circular dependency:') ||
          msg.includes('circular dependency') ||
          msg.includes('CIRCULAR_DEPENDENCY')
        ) {
          return;
        }
        originalWarn(msg, options);
      };

      config.logger.info = (msg, options) => {
        if (
          msg.includes('Circular dependency') ||
          msg.includes('circular dependency') ||
          msg.includes('CIRCULAR_DEPENDENCY')
        ) {
          return;
        }
        originalInfo(msg, options);
      };

      // Interceptar console.warn globalmente
      console.warn = (...args) => {
        const msg = args.join(' ');
        if (
          msg.includes('Circular dependency') ||
          msg.includes('circular dependency') ||
          msg.includes('CIRCULAR_DEPENDENCY')
        ) {
          return;
        }
        originalConsoleWarn(...args);
      };
    }
  };
}

export default defineConfig({
	plugins: [
		tailwindcss(), 
		sveltekit(), 
		suppressCircularDependencyWarnings(),
	],
	ssr: {
		// Justificación: `bits-ui` tiene problemas de inicialización en el entorno SSR de Vite.
		// Al añadirlo a `noExternal`, forzamos a Vite a procesar y empaquetar este módulo
		// junto con nuestro código de servidor, lo que resuelve el error `Cannot read properties of undefined`.
		// Esta es la solución estándar para este tipo de problemas de compatibilidad de módulos.
		noExternal: ['bits-ui', 'svelte-sonner']
	},
	build: {
		rollupOptions: {
			onwarn(warning, defaultHandler) {
				if (warning.code === 'CIRCULAR_DEPENDENCY') return;
				defaultHandler(warning);
			}
		}
	}
});

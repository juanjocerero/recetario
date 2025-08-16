import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
	plugins: [
		tailwindcss(), 
		sveltekit(), 
		{
      name: 'suppress-circular-warnings',
      configResolved(cfg) {
        const _logWarn = cfg.logger.warn;
        cfg.logger.warn = (msg, options) => {
          if (msg.includes('circular dependency')) return;
          _logWarn(msg, options);
        };
      }
    }
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
			// --- silencia los warnings de dependencia circular ---
			onwarn(warning, warn) {
				if (warning.code === 'CIRCULAR_DEPENDENCY') return;
				warn(warning);
			}
		}
	}
});

import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			// silencia los warnings de dependencias circulares
			rollup: {
				onwarn(warning, defaultHandler) {
					// silencia los warnings de dependencias circulares
					if (warning.code === 'CIRCULAR_DEPENDENCY') return;
					defaultHandler(warning);
				}
			}
		}),
	}
};

export default config;
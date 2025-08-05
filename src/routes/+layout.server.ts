// Ruta: src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	// Le decimos a SvelteKit que los datos de esta función `load` dependen
	// de un identificador personalizado 'app:auth'. Cuando este identificador
	// sea invalidado, SvelteKit sabrá que debe volver a ejecutar esta función.
	depends('app:auth');

	return {
		user: locals.user
	};
};

// Ruta: src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Pasamos directamente el objeto de sesión y el usuario a la data del layout.
	// Si locals.session es null, tanto session como user serán undefined.
	return {
		session: locals.session?.session,
		user: locals.session?.user
	};
};

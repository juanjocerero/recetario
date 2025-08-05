// Ruta: src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

/**
 * La función `load` del layout principal.
 * Su única responsabilidad ahora es exponer datos del servidor a la UI.
 * La lógica de autenticación ya ha sido gestionada por el hook (`src/hooks.server.ts`).
 */
export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	// `locals.user` ya contiene la información del usuario (o null)
	// que fue procesada por el hook. Simplemente la pasamos.
	const flash = cookies.get('flash_message');
	if (flash) {
		cookies.delete('flash_message', { path: '/' });
	}
	return {
		user: locals.user,
		theme: cookies.get('theme'),
		flash
	};
};

// Ruta: src/hooks.server.ts
import { verifyToken } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

/**
 * Middleware que se ejecuta en cada petición al servidor.
 * Su propósito es centralizar la autenticación y autorización.
 */
export const handle: Handle = async ({ event, resolve }) => {
	// 1. Obtenemos el usuario a partir del token en cada petición.
	const token = event.cookies.get('session');
	event.locals.user = token ? await verifyToken(token) : null;

	const { pathname } = event.url;

	// 2. Rutas públicas accesibles por CUALQUIER usuario (autenticado o no).
	const alwaysPublicRoutes = ['/login', '/', '/recetas/busqueda-avanzada'];
	if (alwaysPublicRoutes.includes(pathname)) {
		return resolve(event);
	}

	// 3. Endpoints de API públicos.
	if (
		(pathname.startsWith('/api/recipes') && event.request.method === 'GET') ||
		(pathname === '/api/recipes/search' && event.request.method === 'POST') ||
		(pathname === '/api/search/all' && event.request.method === 'GET')
	) {
		return resolve(event);
	}

	// 4. Para cualquier otra ruta, el usuario DEBE estar autenticado.
	//    Si no hay un usuario en `event.locals`, lo redirigimos al login.
	if (!event.locals.user) {
		throw redirect(303, `/login?redirectTo=${pathname}`);
	}

	// 5. Si el usuario está autenticado, puede continuar.
	return resolve(event);
};

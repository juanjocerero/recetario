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
	//    - La página de login.
	//    - La página principal y la API necesaria para que funcione.
	const alwaysPublicRoutes = ['/login', '/'];
	if (alwaysPublicRoutes.includes(pathname) || pathname.startsWith('/api/recipes')) {
		return resolve(event);
	}

	// 3. Para cualquier otra ruta, el usuario DEBE estar autenticado.
	//    Si no hay un usuario en `event.locals`, lo redirigimos al login.
	if (!event.locals.user) {
		throw redirect(303, `/login?redirectTo=${pathname}`);
	}

	// 4. Si el usuario está autenticado, puede continuar.
	//    (Aquí se podrían añadir comprobaciones de roles si fuera necesario,
	//    por ejemplo, si solo los administradores pueden acceder a /admin).
	return resolve(event);
};
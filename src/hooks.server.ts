// Ruta: src/hooks.server.ts
import { verifyToken } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';

/**
 * Middleware que se ejecuta en cada petición al servidor.
 * Su propósito es centralizar la autenticación y autorización.
 */
export const handle: Handle = async ({ event, resolve }) => {
	// 1. Obtenemos el usuario a partir del token de la cookie en cada petición.
	//    El resultado (usuario o null) se guarda en `event.locals.user` para que
	//    esté disponible en las funciones `load` y acciones de todo el sitio.
	const token = event.cookies.get('session');
	event.locals.user = token ? await verifyToken(token) : null;

	const { pathname } = event.url;

	// 2. Si el usuario es administrador, tiene acceso a todas las rutas.
	//    Continuamos sin ninguna comprobación adicional.
	if (event.locals.user?.isAdmin) {
		return resolve(event);
	}

	// 3. Para usuarios no autenticados (o no administradores), definimos las rutas públicas.
	//    Estas son las únicas rutas a las que podrán acceder.
	const isPublicRoute =
		pathname === '/' ||
		pathname === '/login' ||
		// Permite ver la lista de recetas y recetas individuales, pero no crearlas ni editarlas.
		(pathname.startsWith('/recetas') && !pathname.endsWith('/editar') && pathname !== '/recetas/nueva') ||
		// Permite las llamadas a la API para leer recetas (necesario para la página principal).
		(pathname.startsWith('/api/recipes') && event.request.method === 'GET');

	// 4. Si la ruta solicitada NO es pública, redirigimos al usuario a la página de login.
	if (!isPublicRoute) {
		// Usamos el código de estado 303 (See Other), que es apropiado para redirigir
		// después de una acción (como un POST) y asegura que la nueva petición sea GET.
		// Añadimos `redirectTo` para poder volver a la página original tras un login exitoso.
		throw redirect(303, `/login?redirectTo=${pathname}`);
	}

	// 5. Si la ruta es pública, permitimos que la petición continúe.
	return resolve(event);
};

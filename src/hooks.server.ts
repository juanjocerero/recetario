// Ruta: src/hooks.server.ts
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// El manejador de Better Auth se encarga de las rutas /api/auth/*
// y necesita el flag `building` para funcionar correctamente.
const betterAuthHandle: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth, building });
};

// Tu lógica de autorización personalizada
const authorizationHandle: Handle = async ({ event, resolve }) => {
	// Solo ejecutamos esta lógica si no estamos en una ruta de la API de auth
	if (!event.url.pathname.startsWith('/api/auth')) {
		// Obtenemos la sesión del usuario en cada petición
		event.locals.session = await auth.api.getSession({
			headers: event.request.headers
		});

		const { pathname } = event.url;

		// Rutas públicas que no requieren autenticación
		const publicRoutes = ['/login', '/signup', '/', '/recetas/busqueda-avanzada'];
		if (publicRoutes.includes(pathname)) {
			return resolve(event);
		}

		// Endpoints de API públicos
		if (
			(pathname.startsWith('/api/recipes') && event.request.method === 'GET') ||
			(pathname === '/api/recipes/search' && event.request.method === 'POST') ||
			(pathname === '/api/search/all' && event.request.method === 'GET')
		) {
			return resolve(event);
		}

		// Si el usuario no está autenticado, redirigir al login
		if (!event.locals.session) {
			throw redirect(303, `/login?redirectTo=${pathname}`);
		}
	}

	// Continuar con la petición
	return resolve(event);
};

// Usamos `sequence` para encadenar los manejadores.
// Better Auth se ejecuta primero para gestionar sus rutas y sesiones,
// y luego se ejecuta nuestra lógica de autorización personalizada.
export const handle = sequence(betterAuthHandle, authorizationHandle);

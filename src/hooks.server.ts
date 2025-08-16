// Ruta: src/hooks.server.ts
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import fs from 'fs';
import path from 'path';

const IMAGE_DIR = path.join(process.cwd(), 'static', 'images', 'recipes');

/**
 * Este manejador sirve imágenes estáticas generadas dinámicamente.
 * Intercepta las peticiones a /images/recipes/* y sirve el fichero correspondiente
 * desde el directorio `static/images/recipes`.
 */
const staticImageHandle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname.startsWith('/images/recipes/')) {
		const imageName = path.basename(pathname);
		const filePath = path.join(IMAGE_DIR, imageName);

		if (fs.existsSync(filePath)) {
			const fileBuffer = fs.readFileSync(filePath);
			return new Response(fileBuffer, {
				status: 200,
				headers: {
					'Content-Type': 'image/webp', // Asumimos que todas son webp
					'Cache-Control': 'public, max-age=31536000, immutable' // Cachear por 1 año
				}
			});
		}
	}

	// Si no es una imagen de receta, continuar con el siguiente manejador.
	return resolve(event);
};

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
		const sessionInfo = await auth.api.getSession({
			headers: event.request.headers
		});

		if (sessionInfo && sessionInfo.user) {
			event.locals.session = {
				session: sessionInfo.session,
				user: {
					...sessionInfo.user,
					role: sessionInfo.user.role ?? 'user'
				}
			};
		} else {
			event.locals.session = null;
		}
		
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
// El manejador de imágenes se ejecuta primero.
export const handle = sequence(staticImageHandle, betterAuthHandle, authorizationHandle);

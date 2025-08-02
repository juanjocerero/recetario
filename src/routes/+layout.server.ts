import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { verifyToken } from '$lib/server/auth';

// Fichero: src/routes/+layout.server.ts
// Este load se ejecuta en cada petición del lado del servidor.
// Su propósito es proteger todas las rutas y asegurar que solo usuarios
// autenticados puedan acceder a la aplicación.

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	// Excluimos la ruta de login de la verificación para evitar un bucle de redirecciones.
	if (url.pathname === '/login') {
		return {};
	}

	const token = cookies.get('session');

	// Si no hay token, el usuario no está autenticado.
	// Redirigimos a la página de login.
	if (!token) {
		throw redirect(307, '/login');
	}

	try {
		// Verificamos la validez del token. La función `verifyToken` se encarga
		// de la lógica de validación criptográfica.
		const user = await verifyToken(token);
		// Si el token es válido, devolvemos los datos del usuario.
		// Estos datos estarán disponibles en el objeto `data` en las páginas y layouts.
		return {
			user
		};
	} catch (error) {
		// Si el token es inválido (expirado, malformado, etc.), lo consideramos un fallo de autenticación.
		console.error('Fallo en la verificación del token:', error);

		// Eliminamos la cookie inválida para limpiar el estado del cliente.
		cookies.delete('session', { path: '/' });

		// Redirigimos al usuario a la página de login.
		throw redirect(307, '/login');
	}
};

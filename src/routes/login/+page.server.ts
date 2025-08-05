// Ruta: src/routes/login/+page.server.ts
import { type Actions, fail, redirect } from '@sveltejs/kit';
import { comparePasswords, createSessionToken } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

// Justificación: Se define una 'action' de SvelteKit en lugar de un endpoint de API.
// Esto integra el manejo del formulario directamente con el ciclo de vida de la página,
// lo que es más robusto y la forma idiomática de manejar envíos de formularios en SvelteKit.
export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const user = data.get('user');
		const password = data.get('password');

		// 1. Validación de entrada
		if (!user || !password || typeof user !== 'string' || typeof password !== 'string') {
			return fail(400, { message: 'Usuario y contraseña son requeridos' });
		}

		// 2. Verificación de credenciales
		if (!env.ADMIN_PASSWORD_HASH) {
			console.error('La variable de entorno ADMIN_PASSWORD_HASH no está configurada.');
			return fail(500, { message: 'Error de configuración en el servidor' });
		}

		const isAdminUser = user === 'juanjocerero';
		const isPasswordValid = await comparePasswords(password, env.ADMIN_PASSWORD_HASH);

		if (!isAdminUser || !isPasswordValid) {
			return fail(401, { message: 'Credenciales inválidas' });
		}

		// 3. Creación del token y establecimiento de la cookie
		const token = await createSessionToken({ sub: 'admin' });
		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 // 1 día
		});

		// Justificación: Se establece un "flash message" en una cookie para mostrar
		// una notificación de éxito en la página a la que se redirige.
		cookies.set('flash_message', '¡Bienvenido de nuevo!', { path: '/' });

		// 4. Redirección
		// Justificación (redirect): En lugar de devolver un JSON, una 'action' exitosa
		// puede lanzar una redirección. SvelteKit la gestionará correctamente,
		// tanto en el lado del servidor como en el cliente (si se usa `enhance`).
		throw redirect(303, '/');
	}
};

// Ruta: src/routes/api/login/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { comparePasswords, createSessionToken } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

// Justificación: Este es el endpoint de la API que maneja el login.
// Solo acepta peticiones POST para mayor seguridad.
export const POST: RequestHandler = async ({ request, cookies }) => {
	const { user, password } = await request.json();

	// 1. Validación de entrada básica
	if (!user || !password || typeof user !== 'string' || typeof password !== 'string') {
		return json({ message: 'Usuario y contraseña son requeridos' }, { status: 400 });
	}

	// Justificación: Se comprueba que las variables de entorno críticas existan.
	// Si no, es un error de configuración del servidor y no se debe continuar.
	if (!env.ADMIN_PASSWORD_HASH) {
		console.error('La variable de entorno ADMIN_PASSWORD_HASH no está configurada.');
		return json({ message: 'Error de configuración en el servidor' }, { status: 500 });
	}

	// 2. Verificación de credenciales
	// Justificación: Comparamos el usuario contra un valor fijo y la contraseña
	// contra el hash almacenado en las variables de entorno. Esto es seguro.
	const isAdminUser = user === 'admin';
	const isPasswordValid = await comparePasswords(password, env.ADMIN_PASSWORD_HASH);

	if (!isAdminUser || !isPasswordValid) {
		return json({ message: 'Credenciales inválidas' }, { status: 401 });
	}

	// 3. Creación del token de sesión
	const token = await createSessionToken({ sub: 'admin' });

	// 4. Establecimiento de la cookie de sesión
	// Justificación: La cookie se establece como HttpOnly para prevenir ataques XSS,
	// secure=true para que solo se envíe sobre HTTPS en producción, y SameSite=Strict
	// para prevenir ataques CSRF.
	cookies.set('session', token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 // 1 día
	});

	return json({ message: 'Login exitoso' });
};
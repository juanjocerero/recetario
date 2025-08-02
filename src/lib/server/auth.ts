// Ruta: src/lib/server/auth.ts
import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcryptjs';
import { env } from '$env/dynamic/private';

// Justificación (bcrypt): Usamos bcrypt para hashear contraseñas. Es un algoritmo
// adaptativo y lento por diseño, lo que lo hace resistente a ataques de fuerza bruta.
const SALT_ROUNDS = 10; // Número de rondas de salting. 10 es un buen equilibrio.

export async function hashPassword(password: string) {
	return await hash(password, SALT_ROUNDS);
}

export async function comparePasswords(password: string, hash: string) {
	return await compare(password, hash);
}

// Justificación (JWT en Cookie): Usamos JSON Web Tokens (JWT) para gestionar sesiones.
// El token se firma en el servidor con un secreto y se envía al cliente en una cookie
// HttpOnly, lo que previene el acceso desde JavaScript (ataques XSS).

// Justificación: Se comprueba que la variable de entorno crítica exista al iniciar.
// Si no, es un error de configuración del servidor y la aplicación no debe arrancar.
if (!env.SESSION_SECRET) {
	throw new Error(
		'La variable de entorno SESSION_SECRET no está configurada. La aplicación no puede iniciarse de forma segura.'
	);
}

const secret = new TextEncoder().encode(env.SESSION_SECRET);
const algorithm = 'HS256'; // Algoritmo de firma

export async function createSessionToken(payload: { sub: string; [key: string]: unknown }) {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: algorithm })
		.setExpirationTime('24h') // El token expira en 24 horas
		.setIssuedAt()
		.setSubject(payload.sub)
		.sign(secret);
}

export async function verifyToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, secret, {
			algorithms: [algorithm]
		});

		// Justificación: Añadimos explícitamente la propiedad `isAdmin` si el
		// sujeto (sub) del token es 'admin'. Esto asegura que el objeto `user`
		// que se pasa a la aplicación contiene la información de rol necesaria.
		const user = {
			sub: payload.sub,
			isAdmin: payload.sub === 'admin'
		};

		return user;
	} catch (error) {
		return null; // El token es inválido o ha expirado
	}
}
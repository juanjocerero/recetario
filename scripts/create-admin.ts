// Fichero: scripts/create-admin.ts
import { PrismaClient } from '@prisma/client';
import { auth } from '../src/lib/server/auth';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'juanjocerero@gmail.com';

// Type guard para comprobar de forma segura si un objeto tiene un mensaje de error
function isErrorWithMessage(error: unknown): error is { message: string } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as { message: unknown }).message === 'string'
	);
}

async function createAdmin() {
	console.log(`🚀 Iniciando creación del usuario administrador: ${ADMIN_EMAIL}`);

	// 1. Leer la contraseña de una variable de entorno
	const password = process.env.ADMIN_PASSWORD;
	if (!password) {
		console.error('❌ Error: La variable de entorno ADMIN_PASSWORD no está definida.');
		console.error("👉 Ejecuta el script así: ADMIN_PASSWORD='tu_super_contraseña' npx tsx scripts/create-admin.ts");
		process.exit(1);
	}
	if (password.length < 8) {
		console.error('❌ Error: La contraseña debe tener al menos 8 caracteres.');
		process.exit(1);
	}

	// 2. Comprobar si el usuario ya existe
	const existingUser = await prisma.user.findUnique({
		where: { email: ADMIN_EMAIL }
	});

	if (existingUser) {
		console.warn(`⚠️  Advertencia: El usuario administrador con email "${ADMIN_EMAIL}" ya existe.`);
		return;
	}

	// 3. Crear el usuario usando la API de Better Auth
	console.log('⏳ Creando usuario...');
	const result = await auth.api.signUpEmail({
		body: {
			email: ADMIN_EMAIL,
			password: password,
			name: 'Administrador'
		}
	});

	if ('user' in result && result.user) {
		// 4. Asignar el rol de ADMIN
		console.log(`✅ Usuario creado con ID: ${result.user.id}. Asignando rol de ADMIN...`);
		await prisma.user.update({
			where: { id: result.user.id },
			data: { role: 'ADMIN' }
		});
		console.log('🎉 ¡Usuario administrador creado con éxito!');
	} else if ('error' in result) {
		const errorMessage = isErrorWithMessage(result.error)
			? result.error.message
			: 'Error desconocido';
		console.error('❌ Error al crear el usuario:', errorMessage);
		process.exit(1);
	}
}

createAdmin()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
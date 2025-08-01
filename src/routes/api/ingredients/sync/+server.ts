// Ruta: src/routes/api/ingredients/sync/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { ingredientService } from '$lib/server/services/ingredientService';
import { verifySessionToken } from '$lib/server/auth';

/**
 * @description Endpoint para sincronizar los ingredientes con Open Food Facts
 * @returns {Response}
 */
export const POST: RequestHandler = async ({ cookies }) => {
	// Justificación: Se protege el endpoint verificando el token de autenticación
	// del usuario. Esto asegura que solo usuarios logueados puedan iniciar un proceso
	// que consume recursos como es la sincronización.
	const token = cookies.get('session'); // CORREGIDO: El nombre de la cookie es 'session'
	if (!token || !(await verifySessionToken(token))) {
		return json({ message: 'No autorizado' }, { status: 401 });
	}

	try {
		// Justificación: Se invoca la lógica de negocio desde el servicio correspondiente.
		// El controlador (este archivo) se mantiene simple, delegando la complejidad
		// al `ingredientService`, lo que facilita el mantenimiento y las pruebas.
		const result = await ingredientService.syncWithOpenFoodFacts();
		return json(result, { status: 200 });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el servidor';
		return json({ message: errorMessage }, { status: 500 });
	}
};

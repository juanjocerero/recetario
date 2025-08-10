// Ruta: src/routes/api/diary/[...date]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { diaryService } from '$lib/server/services/diaryService';
import { createFailResponse } from '$lib/server/zodErrors';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const dateParam = params.date;
		console.log(`[API Endpoint] Received date parameter: "${dateParam}"`); // LOG DEPURACIÓN

		if (!dateParam) {
			return json(createFailResponse('Parámetro de fecha no proporcionado'), { status: 400 });
		}

		const [startDateStr, endDateStr] = dateParam.split('/');

		const startDate = new Date(startDateStr);
		const endDate = endDateStr ? new Date(endDateStr) : new Date(startDate);

		if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
			return json(createFailResponse('Formato de fecha inválido'), { status: 400 });
		}

		startDate.setHours(0, 0, 0, 0);
		endDate.setHours(23, 59, 59, 999);

		// TODO: GESTIÓN DE USUARIOS (FUTURO)
		// Reemplazar este valor hardcodeado con el ID del usuario autenticado
		// obtenido de `locals.user.id`.
		const userId = 'juanjocerero';
		console.log(`[API Endpoint] Parsed dates: START=${startDate.toISOString()} | END=${endDate.toISOString()} | USER=${userId}`); // LOG DEPURACIÓN

		const entries = await diaryService.getDiaryEntries(userId, startDate, endDate);
		console.log(`[API Endpoint] Found ${entries.length} entries for user.`); // LOG DEPURACIÓN
		return json(entries);
	} catch (error) {
		console.error('Error fetching diary entries:', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

// Ruta: src/routes/api/diary/[...date]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { diaryService } from '$lib/server/services/diaryService';
import { createFailResponse } from '$lib/server/zodErrors';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const session = locals.session;
		if (!session?.user) {
			return json(createFailResponse('No autorizado'), { status: 401 });
		}

		const dateParam = params.date;

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

		const userId = session.user.id;

		const entries = await diaryService.getDiaryEntries(userId, startDate, endDate);
		return json(entries);
	} catch (error) {
		console.error('Error obteniendo entradas del diario:', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

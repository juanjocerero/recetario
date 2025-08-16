// Ruta: src/routes/api/diary/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { diaryService } from '$lib/server/services/diaryService';
import { ZodError } from 'zod';
import { createFailResponse } from '$lib/server/zodErrors';
import { DiaryEntrySchema } from '$lib/schemas/diarySchema';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = locals.session;
		if (!session?.user) {
			return json(createFailResponse('No autorizado'), { status: 401 });
		}

		const body = await request.json();
		const validatedData = DiaryEntrySchema.parse(body);

		const userId = session.user.id;

		const dataWithUser = { ...validatedData, userId };

		const newEntry = await diaryService.addDiaryEntry(dataWithUser);
		return json(newEntry, { status: 201 });
	} catch (error) {
		if (error instanceof ZodError) {
			return json(createFailResponse('La validación de los datos falló', error), { status: 400 });
		}
		console.error('Error al crear la entrada del diario:', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

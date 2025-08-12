// Ruta: src/routes/api/diary/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { diaryService } from '$lib/server/services/diaryService';
import { ZodError } from 'zod';
import { createFailResponse } from '$lib/server/zodErrors';

// TODO: Crear un esquema de Zod para la validación de la actualización
// import { UpdateDiaryEntrySchema } from '$lib/schemas/diarySchema';

export const PUT: RequestHandler = async ({ request, params }) => {
	try {
		const entryId = params.id;
		if (!entryId) {
			return json(createFailResponse('Falta el ID de la entrada'), { status: 400 });
		}
		
		const body = await request.json();
		// const validatedData = UpdateDiaryEntrySchema.parse(body); // TODO: Habilitar validación
		
		const updatedEntry = await diaryService.updateDiaryEntry(entryId, body);
		
		if (!updatedEntry) {
			return json(createFailResponse('Entrada no encontrada'), { status: 404 });
		}
		
		return json(updatedEntry, { status: 200 });
	} catch (error) {
		if (error instanceof ZodError) {
			return json(createFailResponse('La validación falló', error), { status: 400 });
		}
		console.error('Error actualizando la entrada:', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const entryId = params.id;
		if (!entryId) {
			return json(createFailResponse('Falta el ID de la entrada'), { status: 400 });
		}
		
		const deletedEntry = await diaryService.deleteDiaryEntry(entryId);
		
		if (!deletedEntry) {
			return json(createFailResponse('Entrada no encontrada'), { status: 404 });
		}
		
		return json({ success: true, message: 'Entrada eliminada con éxito.' }, { status: 200 });
	} catch (error) {
		console.error('Error eliminando entrada', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

// Ruta: src/routes/api/diary/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { diaryService } from '$lib/server/services/diaryService';
import { ZodError } from 'zod';
import { createFailResponse } from '$lib/server/zodErrors';

// TODO: Crear un esquema de Zod para la validación de la actualización
// import { UpdateDiaryEntrySchema } from '$lib/schemas/diarySchema';

export const PUT: RequestHandler = async ({ request, params, locals }) => {
	try {
		const session = locals.session;
		if (!session?.user) {
			return json(createFailResponse('No autorizado'), { status: 401 });
		}

		const entryId = params.id;
		if (!entryId) {
			return json(createFailResponse('Falta el ID de la entrada'), { status: 400 });
		}

		// Verificación de propiedad
		const existingEntry = await diaryService.getDiaryEntryById(entryId);
		if (!existingEntry) {
			return json(createFailResponse('Entrada no encontrada'), { status: 404 });
		}
		if (existingEntry.userId !== session.user.id) {
			return json(createFailResponse('No tienes permiso para modificar esta entrada'), {
				status: 403
			});
		}

		const body = await request.json();
		// const validatedData = UpdateDiaryEntrySchema.parse(body); // TODO: Habilitar validación

		const updatedEntry = await diaryService.updateDiaryEntry(entryId, body);

		return json(updatedEntry, { status: 200 });
	} catch (error) {
		if (error instanceof ZodError) {
			return json(createFailResponse('La validación falló', error), { status: 400 });
		}
		console.error('Error actualizando la entrada:', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const session = locals.session;
		if (!session?.user) {
			return json(createFailResponse('No autorizado'), { status: 401 });
		}

		const entryId = params.id;
		if (!entryId) {
			return json(createFailResponse('Falta el ID de la entrada'), { status: 400 });
		}

		// Verificación de propiedad
		const existingEntry = await diaryService.getDiaryEntryById(entryId);
		if (!existingEntry) {
			// Si no existe, podemos considerarlo como una operación exitosa idempotente.
			return json({ success: true, message: 'Entrada no encontrada o ya eliminada.' }, { status: 200 });
		}
		if (existingEntry.userId !== session.user.id) {
			return json(createFailResponse('No tienes permiso para eliminar esta entrada'), {
				status: 403
			});
		}

		await diaryService.deleteDiaryEntry(entryId);

		return json({ success: true, message: 'Entrada eliminada con éxito.' }, { status: 200 });
	} catch (error) {
		console.error('Error eliminando entrada', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

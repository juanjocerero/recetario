// Ruta: src/routes/api/diary/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { diaryService } from '$lib/server/services/diaryService';
import { ZodError } from 'zod';
import { createFailResponse } from '$lib/server/zodErrors';
import { DiaryEntrySchema } from '$lib/schemas/diarySchema';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const validatedData = DiaryEntrySchema.parse(body);
		
		// TODO: GESTIÓN DE USUARIOS (FUTURO)
		// La siguiente sección deberá ser refactorizada cuando se implemente un sistema
		// de autenticación completo.
		// Comprobar si hay un usuario autenticado. Si no, devolver un error 401.
		// 3. Reemplazar el userId hardcodeado con el del usuario de la sesión.
		//    Ejemplo:
		//    const userId = locals.user.id;
		const userId = 'juanjocerero'; // Valor temporal para el usuario administrador.
		
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

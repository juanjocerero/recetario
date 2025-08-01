// Ruta: src/routes/api/ingredients/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { ingredientService } from '$lib/server/services/ingredientService';
import { IngredientSchema } from '$lib/schemas/ingredientSchema';
import { ZodError } from 'zod';
// Justificación: Se importa la nueva utilidad unificada.
import { createFailResponse } from '$lib/server/zodErrors';

export const PUT: RequestHandler = async ({ request, params }) => {
	const { id } = params;
	if (!id) {
		return json(createFailResponse('ID de ingrediente es requerido'), { status: 400 });
	}

	try {
		const body = await request.json();
		const validatedData = IngredientSchema.parse(body);

		const updatedIngredient = await ingredientService.update(id, validatedData);
		return json(updatedIngredient);
	} catch (error) {
		if (error instanceof ZodError) {
			return json(createFailResponse('La validación falló', error), { status: 400 });
		}
		console.error(`Error updating ingredient with id ${id}:`, error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;
	if (!id) {
		return json(createFailResponse('ID de ingrediente es requerido'), { status: 400 });
	}

	try {
		await ingredientService.deleteById(id);
		return new Response(null, { status: 204 }); // 204 No Content
	} catch (error) {
		console.error(`Error deleting ingredient ${id}:`, error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};
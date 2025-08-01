// Ruta: src/routes/api/ingredients/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { ingredientService } from '$lib/server/services/ingredientService';
import { IngredientSchema } from '$lib/schemas/ingredientSchema';
import { ZodError } from 'zod';
// Justificación: Se importa la nueva utilidad unificada.
import { createFailResponse } from '$lib/server/zodErrors';

export const GET: RequestHandler = async () => {
	try {
		const ingredients = await ingredientService.getAllUnified();
		return json(ingredients);
	} catch (error) {
		console.error('Error fetching ingredients:', error);
		// Justificación: Se usa la nueva utilidad para unificar la respuesta de error.
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const validatedData = IngredientSchema.parse(body);
		const newIngredient = await ingredientService.create(validatedData);
		return json(newIngredient, { status: 201 });
	} catch (error) {
		if (error instanceof ZodError) {
			// Justificación: Se usa la nueva utilidad para el error de validación.
			return json(createFailResponse('La validación falló', error), { status: 400 });
		}
		console.error('Error creating ingredient:', error);
		// Justificación: Se usa la nueva utilidad para unificar la respuesta de error.
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};
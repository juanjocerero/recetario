// Ruta: src/routes/api/ingredients/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { ingredientService } from '$lib/server/services/ingredientService';
import { IngredientSchema } from '$lib/schemas/ingredientSchema';
import { ZodError } from 'zod';
import { formatZodError } from '$lib/server/zodErrors';

export const GET: RequestHandler = async () => {
	try {
		const ingredients = await ingredientService.getAllUnified();
		return json(ingredients);
	} catch (error) {
		console.error('Error fetching ingredients:', error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
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
			return json(formatZodError(error), { status: 400 });
		}
		console.error('Error creating ingredient:', error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};


// Ruta: src/routes/api/recipes/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recipeService } from '$lib/server/services/recipeService';
import { RecipeSchema } from '$lib/schemas/recipeSchema';
import { ZodError } from 'zod';
// Justificación: Se importa la nueva utilidad unificada.
import { createFailResponse } from '$lib/server/zodErrors';

/**
 * Maneja las peticiones GET para obtener todas las recetas.
 */
export const GET: RequestHandler = async () => {
	try {
		const recipes = await recipeService.getAll();
		return json(recipes);
	} catch (error) {
		console.error('Error fetching recipes:', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

/**
 * Maneja las peticiones POST para crear una nueva receta.
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const validatedData = RecipeSchema.parse(body);

		const newRecipe = await recipeService.create(validatedData);
		return json(newRecipe, { status: 201 }); // 201 Created
	} catch (error) {
		if (error instanceof ZodError) {
			return json(createFailResponse('La validación falló', error), { status: 400 });
		}
		console.error('Error creating recipe:', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};
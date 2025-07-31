// Ruta: src/routes/api/recipes/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recipeService } from '$lib/server/services/recipeService';
import { RecipeSchema } from '$lib/schemas/recipeSchema';
import { ZodError } from 'zod';
import { formatZodError } from '$lib/server/zodErrors';

/**
 * Maneja las peticiones GET para obtener una receta por su ID.
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const recipe = await recipeService.getById(params.id);
		if (!recipe) {
			return json({ message: 'Receta no encontrada' }, { status: 404 });
		}
		return json(recipe);
	} catch (error) {
		console.error(`Error fetching recipe ${params.id}:`, error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

/**
 * Maneja las peticiones PUT para actualizar una receta.
 */
export const PUT: RequestHandler = async ({ request, params }) => {
	try {
		const body = await request.json();
		const validatedData = RecipeSchema.parse(body);

		const updatedRecipe = await recipeService.update(params.id, validatedData);
		if (!updatedRecipe) {
			return json({ message: 'Receta no encontrada para actualizar' }, { status: 404 });
		}
		return json(updatedRecipe);
	} catch (error) {
		if (error instanceof ZodError) {
			return json(formatZodError(error), { status: 400 });
		}
		console.error(`Error updating recipe ${params.id}:`, error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

/**
 * Maneja las peticiones DELETE para eliminar una receta.
 */
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await recipeService.deleteById(params.id);
		return new Response(null, { status: 204 }); // 204 No Content
	} catch (error) {
		// Podríamos verificar si el error es porque el registro no existe (P2025 en Prisma)
		console.error(`Error deleting recipe ${params.id}:`, error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

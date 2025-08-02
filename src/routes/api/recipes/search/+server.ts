// Fichero: src/routes/api/recipes/search/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recipeService } from '$lib/server/services/recipeService';
import { SearchFiltersSchema } from '$lib/schemas/searchSchema';
import { ZodError } from 'zod';

const RECIPES_PER_PAGE = 50;

/**
 * Endpoint POST para la búsqueda avanzada de recetas.
 * Acepta un cuerpo JSON con filtros estructurados.
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Justificación: Se usa Zod para validar y parsear el cuerpo de la petición.
		// Esto asegura que los datos son del tipo correcto y previene errores.
		// `.parse` lanza un error si la validación falla, que es capturado por el catch.
		const filters = SearchFiltersSchema.parse(body);

		// Lógica de paginación: usamos la constante del servidor para el `limit`.
		const recipesPlusOne = await recipeService.findAdvanced({
			...filters,
			limit: RECIPES_PER_PAGE + 1
		});

		const hasMore = recipesPlusOne.length > RECIPES_PER_PAGE;
		const recipes = recipesPlusOne.slice(0, RECIPES_PER_PAGE);

		return json({
			recipes,
			hasMore
		});
	} catch (error) {
		// Si el error es de validación de Zod, devolvemos un error 400 (Bad Request).
		if (error instanceof ZodError) {
			return json({ message: 'Datos de búsqueda inválidos', errors: error.flatten() }, { status: 400 });
		}

		console.error('Error en el endpoint de búsqueda avanzada:', error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

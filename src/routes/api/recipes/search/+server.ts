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
	// --- LOGGING: ID único para la petición ---
	// const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
	//  console.log(`\n--- [${requestId}] INICIO: Petición de búsqueda recibida ---`);
	
	try {
		const body = await request.json();
		
		// --- LOGGING: Cuerpo de la petición recibido ---
		// console.log(`[${requestId}] BODY RECIBIDO:`, JSON.stringify(body, null, 2));
		
		const filters = SearchFiltersSchema.parse(body);
		
		// --- LOGGING: Filtros validados por Zod ---
		// console.log(`[${requestId}] FILTROS VALIDADOS:`, JSON.stringify(filters, null, 2));
		
		const queryOptions = {
			...filters,
			limit: RECIPES_PER_PAGE + 1
		};
		
		// --- LOGGING: Opciones de consulta a la base de datos ---
		// Esto es lo que se pasará a Prisma
		// console.log(`[${requestId}] QUERY OPTIONS (para recipeService):`, JSON.stringify(queryOptions, null, 2));
		
		const recipesPlusOne = await recipeService.findAdvanced(queryOptions);
		
		const hasMore = recipesPlusOne.length > RECIPES_PER_PAGE;
		const recipes = recipesPlusOne.slice(0, RECIPES_PER_PAGE);
		
		// --- LOGGING: Resultado de la operación ---
		// console.log(`[${requestId}] RESULTADO: ${recipes.length} recetas encontradas. ¿Hay más?: ${hasMore}`);
		// console.log(`--- [${requestId}] FIN: Petición completada exitosamente ---`);
		
		return json({
			recipes,
			hasMore
		});
	} catch (error) {
		// --- LOGGING: Error en el proceso ---
		// console.error(`--- [${requestId}] ERROR: Ha ocurrido un error en el endpoint ---`, error);
		
		if (error instanceof ZodError) {
			return json({ message: 'Datos de búsqueda inválidos', errors: error.flatten() }, { status: 400 });
		}
		
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};
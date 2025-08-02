// Fichero: src/routes/api/recipes/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recipeService } from '$lib/server/services/recipeService';

const DEFAULT_LIMIT = 50;

/**
 * Endpoint GET para buscar y paginar recetas.
 * Acepta los siguientes parámetros de búsqueda en la URL:
 * - `q`: El término de búsqueda (opcional).
 * - `limit`: El número de resultados a devolver (por defecto 50).
 * - `offset`: El número de resultados a saltar.
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const searchTerm = url.searchParams.get('q');
		const limit = parseInt(url.searchParams.get('limit') ?? `${DEFAULT_LIMIT}`, 10);
		const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

		// Justificación (Paginación eficiente): Solicitamos un elemento más del límite
		// para determinar si existen más resultados sin necesidad de una segunda consulta
		// o un `count()` total, lo cual es mucho más performante.
		const recipesPlusOne = await recipeService.findPaginated(searchTerm, limit + 1, offset);

		const hasMore = recipesPlusOne.length > limit;
		// Devolvemos solo el número de recetas solicitado originalmente.
		const recipes = recipesPlusOne.slice(0, limit);

		return json({
			recipes,
			hasMore
		});
	} catch (error) {
		console.error('Error en el endpoint de búsqueda de recetas:', error);
		// Devolvemos un error 500 genérico para no exponer detalles internos.
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

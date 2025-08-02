import type { PageServerLoad, Actions } from './$types';
import { recipeService } from '$lib/server/services/recipeService';
import { fail } from '@sveltejs/kit';

const RECIPES_PER_PAGE = 50;

/**
 * Función `load` para la carga inicial de datos.
 * Carga el primer lote de recetas de forma paginada.
 */
export const load: PageServerLoad = async () => {
	// Justificación: Se llama a `findPaginated` para cargar solo la primera página
	// de resultados. Esto mejora drásticamente el tiempo de carga inicial.
	// Se solicita un elemento más para determinar si hay más páginas.
	const recipesPlusOne = await recipeService.findPaginated(null, RECIPES_PER_PAGE + 1, 0);

	const hasMore = recipesPlusOne.length > RECIPES_PER_PAGE;
	const recipes = recipesPlusOne.slice(0, RECIPES_PER_PAGE);

	return {
		recipes,
		hasMore
	};
};

/**
 * Acciones del servidor para la página de recetas.
 */
export const actions: Actions = {
	/**
	 * Acción `delete`: Gestiona la eliminación de una receta.
	 */
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');

		if (typeof id !== 'string' || !id) {
			return fail(400, { message: 'ID de receta no válido' });
		}

		try {
			await recipeService.deleteById(id);
			return {
				status: 200,
				message: 'Receta eliminada correctamente'
			};
		} catch (error) {
			console.error('Error al eliminar la receta:', error);
			return fail(500, {
				message: 'No se pudo eliminar la receta. Por favor, inténtelo de nuevo.'
			});
		}
	}
};
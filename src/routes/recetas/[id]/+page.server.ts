// Ruta: src/routes/recetas/[id]/+page.server.ts
import { error } from '@sveltejs/kit';
import { recipeService } from '$lib/server/services/recipeService';
import type { PageServerLoad } from './$types';

// Justificación: La función `load` del servidor es ideal para cargar los datos
// de una receta específica antes de que la página se renderice.
// Esto asegura que los datos estén disponibles inmediatamente y mejora el SEO.
export const load: PageServerLoad = async ({ params }) => {
	const recipe = await recipeService.getById(params.id);

	if (!recipe) {
		throw error(404, 'Receta no encontrada');
	}

	return {
		recipe
	};
};

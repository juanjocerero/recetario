// Ruta: src/routes/recetas/[id]/editar/+page.server.ts
import { error } from '@sveltejs/kit';
import { recipeService } from '$lib/server/services/recipeService';
import type { PageServerLoad } from './$types';

// Justificación: La función `load` se ejecuta en el servidor antes de renderizar la página.
// Es el lugar idóneo para cargar los datos necesarios para la edición de una receta.
// Si la receta no se encuentra, lanzamos un error 404 para que SvelteKit muestre la página de error.
export const load: PageServerLoad = async ({ params }) => {
	const recipe = await recipeService.getById(params.id);

	if (!recipe) {
		throw error(404, 'Receta no encontrada');
	}

	// Justificación: Devolvemos un objeto `recipe` que contiene todos los datos necesarios.
	// SvelteKit se encarga de serializarlo y pasarlo como prop `data` a la página Svelte.
	// Esto asegura que el frontend tenga toda la información para pre-rellenar el formulario.
	return {
		recipe
	};
};

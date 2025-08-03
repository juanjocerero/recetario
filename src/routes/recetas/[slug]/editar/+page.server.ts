// Ruta: src/routes/recetas/[slug]/editar/+page.server.ts
import { error, fail } from '@sveltejs/kit';
import { recipeService } from '$lib/server/services/recipeService';
import type { PageServerLoad, Actions } from './$types';
import { RecipeSchema } from '$lib/schemas/recipeSchema';
import { createFailResponse } from '$lib/server/zodErrors';

export const load: PageServerLoad = async ({ params }) => {
	const recipe = await recipeService.getBySlug(params.slug);

	if (!recipe) {
		throw error(404, 'Receta no encontrada');
	}

	return {
		recipe
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();
		const data = Object.fromEntries(formData.entries());

		const dataToValidate = {
			...data,
			ingredients: JSON.parse(data.ingredients as string),
			urls: JSON.parse(data.urls as string),
			steps: JSON.parse(data.steps as string)
		};

		const validation = RecipeSchema.safeParse(dataToValidate);

		if (!validation.success) {
			const response = createFailResponse('La validación falló. Revisa los campos.', validation.error);
			return fail(400, response);
		}

		try {
			// Para actualizar, necesitamos el ID de la receta.
			// Lo obtenemos buscando la receta por su slug, que es el parámetro de la URL.
			const originalRecipe = await recipeService.getBySlug(params.slug);
			if (!originalRecipe) {
				throw error(404, 'Receta no encontrada para actualizar');
			}

			const updatedRecipe = await recipeService.update(originalRecipe.id, validation.data);
			
			// Devolvemos un objeto success para que `use:enhance` pueda manejarlo.
			return {
				status: 200,
				body: {
					recipe: updatedRecipe
				}
			};
		} catch (err) {
			console.error(err);
			const response = createFailResponse('No se pudo actualizar la receta en el servidor.');
			return fail(500, response);
		}
	}
};

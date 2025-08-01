// Ruta: src/routes/recetas/[id]/editar/+page.server.ts
import { error, fail } from '@sveltejs/kit';
import { recipeService } from '$lib/server/services/recipeService';
import type { PageServerLoad, Actions } from './$types';
import { RecipeSchema } from '$lib/schemas/recipeSchema';
// Justificación: Se importa la nueva utilidad unificada para crear respuestas de error.
import { createFailResponse } from '$lib/server/zodErrors';

export const load: PageServerLoad = async ({ params }) => {
	const recipe = await recipeService.getById(params.id);

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
			urls: JSON.parse(data.urls as string)
		};

		const validation = RecipeSchema.safeParse(dataToValidate);

		if (!validation.success) {
			// Justificación: Se usa la nueva utilidad para el fallo de validación.
			const response = createFailResponse('La validación falló. Revisa los campos.', validation.error);
			return fail(400, response);
		}

		try {
			const updatedRecipe = await recipeService.update(params.id, validation.data);
			return {
				status: 200,
				body: {
					recipe: updatedRecipe
				}
			};
		} catch (err) {
			console.error(err);
			// Justificación: Se usa la misma utilidad para el fallo del servidor,
			// garantizando una estructura de respuesta 100% consistente.
			const response = createFailResponse('No se pudo actualizar la receta.');
			return fail(500, response);
		}
	}
};
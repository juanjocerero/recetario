// Ruta: src/routes/recetas/[slug]/editar/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit';
import { recipeService } from '$lib/server/services/recipeService';
import type { PageServerLoad, Actions } from './$types';
import { RecipeSchema } from '$lib/schemas/recipeSchema';
import { createFailResponse } from '$lib/server/zodErrors';

const getRecipeSteps = (stepsData: unknown): string[] => {
	if (Array.isArray(stepsData)) {
		return stepsData.map(String);
	}
	if (typeof stepsData === 'string') {
		try {
			const parsed = JSON.parse(stepsData);
			return Array.isArray(parsed) ? parsed.map(String) : [String(stepsData)];
		} catch {
			return [String(stepsData)];
		}
	}
	return [''];
};

export const load: PageServerLoad = async ({ params }) => {
	const recipe = await recipeService.getBySlug(params.slug);

	if (!recipe) {
		throw error(404, 'Receta no encontrada');
	}

	return {
		recipe: {
			...recipe,
			steps: getRecipeSteps(recipe.steps)
		}
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
			const originalRecipe = await recipeService.getBySlug(params.slug);
			if (!originalRecipe) {
				throw error(404, 'Receta no encontrada para actualizar');
			}

			const updatedRecipe = await recipeService.update(originalRecipe.id, validation.data);

			if (!updatedRecipe) {
				return fail(500, createFailResponse('No se pudo actualizar la receta.'));
			}

			throw redirect(303, `/recetas/${updatedRecipe.slug}`);
		} catch (err) {
			if (err instanceof Error && 'status' in err && err.status === 303) {
				throw err;
			}
			console.error(err);
			const response = createFailResponse('No se pudo actualizar la receta en el servidor.');
			return fail(500, response);
		}
	}
};

// Ruta: src/routes/recetas/[slug]/+page.server.ts
import { error, fail } from '@sveltejs/kit';
import { recipeService } from '$lib/server/services/recipeService';
import type { PageServerLoad, Actions } from './$types';
import { RecipeSchema } from '$lib/schemas/recipeSchema';
import { createFailResponse } from '$lib/server/zodErrors';
import { marked } from 'marked';
// Justificación: Se importa `sanitize-html` para limpiar el HTML generado por `marked`
// de forma segura en el servidor, sin necesidad de emular un DOM con `jsdom`,
// lo que resuelve el error "require is not defined" en producción.
import sanitizeHtml from 'sanitize-html';

export const load: PageServerLoad = async ({ params }) => {
	const recipe = await recipeService.getBySlug(params.slug);

	if (!recipe) {
		throw error(404, 'Receta no encontrada');
	}

	// Justificación: Se reemplaza la combinación de `jsdom` y `dompurify` por `sanitize-html`.
	// Esta librería está diseñada para ejecutarse en Node.js sin dependencias del DOM,
	// lo que la hace más ligera, rápida y compatible con el entorno de servidor de SvelteKit.
	const processedSteps = await Promise.all(
		Array.isArray(recipe.steps)
			? recipe.steps.map(async (step) => {
					const rawHtml = await marked.parse(String(step ?? ''));
					return sanitizeHtml(rawHtml);
				})
			: []
	);

	return {
		recipe: {
			...recipe,
			steps: processedSteps
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
			// Justificación: Se usa la nueva utilidad para el fallo de validación.
			const response = createFailResponse('La validación falló. Revisa los campos.', validation.error);
			return fail(400, response);
		}
		
		try {
			// Aquí necesitamos el ID, no el slug, para la actualización.
			// Lo obtenemos de la receta original cargada.
			const originalRecipe = await recipeService.getBySlug(params.slug);
			if (!originalRecipe) {
				throw error(404, 'Receta no encontrada para actualizar');
			}
			
			const updatedRecipe = await recipeService.update(originalRecipe.id, validation.data);
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

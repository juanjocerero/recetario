// Ruta: src/routes/recetas/nueva/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { recipeService } from '$lib/server/services/recipeService';
import type { Actions } from './$types';
import { RecipeSchema } from '$lib/schemas/recipeSchema';
import { createFailResponse } from '$lib/server/zodErrors';

// Justificación: Se crea un `actions` object para manejar la creación de la receta.
// Esto alinea la página de 'nueva receta' con las mejores prácticas de SvelteKit
// que ya implementamos en la página de 'editar'.
export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const data = Object.fromEntries(formData.entries());
		
		const dataToValidate = {
			...data,
			// Los datos complejos se envían como JSON string desde el cliente.
			ingredients: JSON.parse(data.ingredients as string),
			urls: JSON.parse(data.urls as string),
			steps: JSON.parse(data.steps as string)
		};
		
		const validation = RecipeSchema.safeParse(dataToValidate);
		
		if (!validation.success) {
			const response = createFailResponse(
				'La validación falló. Revisa los campos.',
				validation.error
			);
			return fail(400, response);
		}
		
		try {
			const newRecipe = await recipeService.create(validation.data);
			if (newRecipe) {
				// Justificación: En caso de éxito, se redirige al usuario a la página
				// de la receta recién creada usando `redirect` de SvelteKit y el nuevo slug.
				throw redirect(303, `/recetas/${newRecipe.slug}`);
			}
			// Este caso no debería ocurrir si el servicio funciona, pero es un fallback.
			return fail(500, createFailResponse('La receta no se pudo crear.'));
		} catch (err) {
			// Si el error es una redirección, SvelteKit la manejará.
			if ((err as { status?: number })?.status === 303) {
				throw err;
			}
			console.error(err);
			const response = createFailResponse('No se pudo crear la receta en el servidor.');
			return fail(500, response);
		}
	}
};

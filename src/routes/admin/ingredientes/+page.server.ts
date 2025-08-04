import { ingredientService } from '$lib/server/services/ingredientService';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { IngredientSchema } from '$lib/schemas/ingredientSchema';
import { createFailResponse } from '$lib/server/zodErrors';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const search = url.searchParams.get('search') ?? '';
	const sort = url.searchParams.get('sort') ?? 'name';
	const order = url.searchParams.get('order') ?? 'asc';

	const apiURL = new URL(url.origin + '/api/ingredients');
	apiURL.searchParams.set('search', search);
	apiURL.searchParams.set('sort', sort);
	apiURL.searchParams.set('order', order);

	const response = await fetch(apiURL);

	if (!response.ok) {
		return { ingredients: [], search, sort, order };
	}

	const ingredients = await response.json();

	return {
		ingredients,
		search,
		sort,
		order
	};
};

export const actions: Actions = {
	addCustom: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
		const validation = IngredientSchema.safeParse(formData);

		if (!validation.success) {
			return fail(400, {
				data: formData,
				...createFailResponse('La validación falló', validation.error)
			});
		}

		try {
			await ingredientService.create(validation.data);
			return { success: true, message: 'Ingrediente personalizado añadido con éxito' };
		} catch (error) {
			console.error('Error al crear el ingrediente personalizado:', error);
			return fail(500, {
				data: formData,
				message: 'No se pudo crear el ingrediente personalizado.'
			});
		}
	},

	update: async ({ request, fetch }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		const response = await fetch(`/api/ingredients/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(Object.fromEntries(formData))
		});

		if (!response.ok) {
			const result = await response.json();
			return fail(response.status, {
				data: Object.fromEntries(formData),
				errors: result.errors,
				id
			});
		}

		return { success: true, message: 'Ingrediente actualizado con éxito' };
	},

	delete: async ({ request, fetch }) => {
		const formData = await request.formData();

		const response = await fetch('/api/ingredients', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(Object.fromEntries(formData))
		});

		if (!response.ok) {
			const result = await response.json();
			return fail(response.status, { message: result.message || 'Error al eliminar el ingrediente.' });
		}

		return { success: true, message: 'Ingrediente eliminado con éxito' };
	}
};

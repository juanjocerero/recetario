import { ingredientService } from '$lib/server/services/ingredientService';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

// Justificación (load): La función `load` ahora llama al endpoint GET de la API usando `fetch`.
// Esto asegura que la página y la API están desacopladas. La página consume su propia API,
// una práctica conocida como "dogfooding", que garantiza que la API es robusta.
export const load: PageServerLoad = async ({ fetch }) => {
	const response = await fetch('/api/ingredients');
	if (!response.ok) {
		// En un caso real, podrías manejar el error de forma más elegante.
		return { ingredients: [] };
	}
	const ingredients = await response.json();
	return {
		ingredients
	};
};

// Justificación (actions): Las acciones ahora empaquetan los datos del formulario y los envían
// al endpoint de la API correspondiente usando `fetch`. La lógica de negocio y la validación
// residen únicamente en la API, y esta acción solo se encarga de la comunicación.
export const actions: Actions = {
	create: async ({ request, fetch }) => {
		const formData = await request.formData();

		const response = await fetch('/api/ingredients', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(Object.fromEntries(formData))
		});

		if (!response.ok) {
			const result = await response.json();
			return fail(response.status, {
				data: Object.fromEntries(formData),
				errors: result.errors
			});
		}

		return { success: true, message: 'Ingrediente creado con éxito' };
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

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const source = formData.get('source') as string;

		try {
			if (source === 'custom') {
				// El ID de un custom ingredient es un CUID, no necesita prefijo.
				await ingredientService.deleteById(id);
			} else if (source === 'product') {
				// El ID de un producto en el frontend es 'product-BARCODE'.
				// Nos aseguramos de extraer solo el código de barras.
				const productId = id.startsWith('product-') ? id.substring(8) : id;
				await ingredientService.deleteProductById(productId);
			} else {
				return fail(400, { message: 'Tipo de ingrediente no válido.' });
			}
			return { success: true, message: 'Ingrediente eliminado con éxito' };
		} catch (error) {
			console.error('Error al eliminar el ingrediente:', error);
			return fail(500, { message: 'Error al eliminar el ingrediente.' });
		}
	}
};
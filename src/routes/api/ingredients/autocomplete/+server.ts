// Fichero: src/routes/api/ingredients/autocomplete/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ingredientService } from '$lib/server/services/ingredientService';

/**
 * Endpoint GET para el autocompletado de ingredientes.
 * Devuelve una lista plana de ingredientes en formato JSON.
 */
export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');

	if (!query) {
		return json({ error: 'Query parameter "q" is required' }, { status: 400 });
	}

	try {
		const { customIngredients, cachedProducts } = await ingredientService.searchByName(query);

		// Justificación: Se aplanan los resultados de ambas fuentes (custom y productos)
		// en un único array, que es el formato que espera el componente combobox.
		const results = [
			...customIngredients.map((ing) => ({
				id: ing.id,
				name: ing.name,
				type: 'custom',
				source: 'local',
				imageUrl: null
			})),
			...cachedProducts.map((prod) => ({
				id: prod.id,
				name: prod.name,
				type: 'product',
				source: 'local',
				imageUrl: prod.imageUrl
			}))
		];

		return json(results);
	} catch (error) {
		console.error('Error en el endpoint de autocompletado de ingredientes:', error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

// Fichero: src/routes/api/ingredients/autocomplete/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { productService } from '$lib/server/services/productService';
import type { Product } from '@prisma/client';

/**
 * Endpoint GET para el autocompletado de productos.
 * Devuelve una lista plana de productos en formato JSON.
 */
export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');

	if (!query) {
		return json({ error: 'Query parameter "q" is required' }, { status: 400 });
	}

	try {
		const products = await productService.searchByName(query);

		// Justificación: Se aplanan los resultados de ambas fuentes (custom y productos)
		// en un único array, que es el formato que espera el componente combobox.
		const results = products.map((product: Product) => ({
			id: product.id,
			name: product.name,
			type: product.barcode ? 'product' : 'custom',
			source: 'local',
			imageUrl: product.imageUrl
		}));

		return json(results);
	} catch (error) {
		console.error('Error en el endpoint de autocompletado de productos:', error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

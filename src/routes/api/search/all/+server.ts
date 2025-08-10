// Ruta: src/routes/api/search/all/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { productService } from '$lib/server/services/productService';
import { recipeService } from '$lib/server/services/recipeService';
import { createFailResponse } from '$lib/server/zodErrors';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const query = url.searchParams.get('q');
		console.log(`[Search All] Received query: "${query}"`);

		if (!query || query.length < 2) {
			return json(
				createFailResponse('Se requiere un término de búsqueda de al menos 2 caracteres'),
				{ status: 400 }
			);
		}

		// Buscamos en paralelo en productos y recetas
		const [products, recipes] = await Promise.all([
			productService.searchByName(query),
			recipeService.findPaginated(query, 20, 0) // Limitamos a 20 recetas por ahora
		]);

		console.log(`[Search All] Found ${products.length} products.`);
		console.log(`[Search All] Found ${recipes.length} recipes.`);

		// Añadimos un campo 'type' para poder distinguirlos en el frontend
		const combinedResults = [
			...products.map((p) => ({ ...p, type: 'PRODUCT' })),
			...recipes.map((r) => ({ ...r, type: 'RECIPE' }))
		];

		console.log(`[Search All] Total combined results: ${combinedResults.length}`);

		// Ordenamos alfabéticamente por nombre/título
		combinedResults.sort((a, b) => {
			const nameA = 'name' in a ? a.name : a.title;
			const nameB = 'name' in b ? b.name : b.title;
			return nameA.localeCompare(nameB);
		});

		return json(combinedResults);
	} catch (error) {
		console.error('Error en la búsqueda unificada:', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

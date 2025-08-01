import { ingredientService } from '$lib/server/services/ingredientService';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Definimos un tipo para la respuesta de OFF para mejorar la legibilidad
type OffProduct = {
	code: string;
	product_name: string;
	image_front_small_url?: string;
};

export const GET: RequestHandler = async ({ url, fetch }) => {
	try {
		const query = url.searchParams.get('q');

		if (!query) {
			return json({ error: 'Query parameter "q" is required' }, { status: 400 });
		}

		// 1. Búsqueda local y externa en paralelo para mayor eficiencia
		const localSearchPromise = ingredientService.searchByName(query);

		// Justificación: Se realizan búsquedas para ambas marcas en paralelo.
		const brands = ['Mercadona', 'Hacendado'];
		const offSearchPromises = brands.map((brand) => {
			const offQuery = `${query} ${brand}`;
			const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
				offQuery
			)}&search_simple=1&action=process&json=1&page_size=10`; // Limitar a 10 por marca
			return fetch(offUrl).then((res) => res.json()) as Promise<{ products: OffProduct[] }>;
		});

		const [localResultsData, ...offResponses] = await Promise.all([
			localSearchPromise,
			...offSearchPromises
		]);

		const { customIngredients, cachedProducts } = localResultsData;

		// 2. Mapear resultados locales a un formato estándar
		const localResults = [
			...customIngredients.map((i) => ({
				id: i.id,
				name: i.name,
				source: 'local' as const,
				imageUrl: null
			})),
			...cachedProducts.map((p) => ({
				id: p.id,
				name: p.name,
				source: 'local' as const,
				imageUrl: p.imageUrl
			}))
		];

		const localIds = new Set(localResults.map((r) => r.id));

		// 3. Combinar y desduplicar resultados de OFF
		const allOffProducts = offResponses.flatMap((response) => response.products || []);
		const uniqueOffProducts = new Map<string, OffProduct>();
		for (const product of allOffProducts) {
			if (product.code && !uniqueOffProducts.has(product.code)) {
				uniqueOffProducts.set(product.code, product);
			}
		}

		// 4. Mapear resultados de OFF, excluyendo los que ya tenemos en local
		const offResults = Array.from(uniqueOffProducts.values())
			.filter((p) => !localIds.has(p.code)) // Excluir duplicados locales
			.map((p) => ({
				id: p.code,
				name: p.product_name,
				source: 'off' as const,
				imageUrl: p.image_front_small_url || null
			}));

		// 5. Combinar y devolver
		const finalResults = [...localResults, ...offResults];

		return json(finalResults);
	} catch (error) {
		console.error('[Search API Error]', error);
		const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
		const errorStack = error instanceof Error ? error.stack : undefined;
		return json(
			{
				error: 'Error interno en la búsqueda de ingredientes.',
				details: errorMessage,
				stack: errorStack // Importante para depuración
			},
			{ status: 500 }
		);
	}
};
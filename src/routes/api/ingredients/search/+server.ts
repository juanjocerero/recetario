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
	const query = url.searchParams.get('q');

	if (!query) {
		return json({ error: 'Query parameter "q" is required' }, { status: 400 });
	}

	// 1. Búsqueda local y externa en paralelo para mayor eficiencia
	const localSearchPromise = ingredientService.searchByName(query);

	const offQuery = `${query} Mercadona`;
	const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
		offQuery
	)}&search_simple=1&action=process&json=1&page_size=20`; // Limitar a 20 resultados

	const offSearchPromise = fetch(offUrl).then((res) => res.json()) as Promise<{ products: OffProduct[] }>;

	const [{ customIngredients, cachedProducts }, offResponse] = await Promise.all([
		localSearchPromise,
		offSearchPromise
	]);

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

	// 3. Mapear resultados de OFF, excluyendo los que ya tenemos en local
	const offResults = offResponse.products
		.filter((p) => p.code && !localIds.has(p.code)) // Excluir duplicados y productos sin código
		.map((p) => ({
			id: p.code,
			name: p.product_name,
			source: 'off' as const,
			imageUrl: p.image_front_small_url || null
		}));

	// 4. Combinar y devolver
	const finalResults = [...localResults, ...offResults];

	return json(finalResults);
};
import { ingredientService } from '$lib/server/services/ingredientService';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Definimos un tipo para la respuesta de OFF para mejorar la legibilidad
type OffProduct = {
	code: string;
	product_name: string;
	image_front_small_url?: string;
};

export const GET: RequestHandler = ({ url, fetch }) => {
	const query = url.searchParams.get('q');

	if (!query) {
		return json({ error: 'Query parameter "q" is required' }, { status: 400 });
	}

	const stream = new ReadableStream({
		async start(controller) {
			const localIds = new Set<string>();

			type SearchResult = {
				id: string;
				name: string;
				source: 'local' | 'off';
				imageUrl: string | null;
			};

			// Función para enviar datos al stream
			const send = (data: SearchResult[]) => {
				controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
			};

			try {
				// 1. Búsqueda local (rápida)
				const { customIngredients, cachedProducts } = await ingredientService.searchByName(query);
				const localResults: SearchResult[] = [
					...customIngredients.map((i) => ({
						id: i.id,
						name: i.name,
						source: 'local',
						imageUrl: null
					})),
					...cachedProducts.map((p) => ({
						id: p.id,
						name: p.name,
						source: 'local',
						imageUrl: p.imageUrl
					}))
				];

				if (localResults.length > 0) {
					localResults.forEach((r) => localIds.add(r.id));
					send(localResults);
				}

				// 2. Búsquedas externas (lentas)
				const brands = ['Hacendado', 'Mercadona'];
				const offSearchPromises = brands.map((brand) => {
					const offQuery = `${query} ${brand}`;
					const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
						offQuery
					)}&search_simple=1&action=process&json=1&page_size=10`;
					
					return fetch(offUrl)
						.then((res) => res.json() as Promise<{ products: OffProduct[] }>)
						.then(response => {
							const offProducts = response.products || [];
							const uniqueOffProducts: SearchResult[] = offProducts
								.filter(p => p.code && !localIds.has(p.code))
								.map(p => {
									localIds.add(p.code); // Asegurar desduplicación entre streams
									return {
										id: p.code,
										name: p.product_name,
										source: 'off',
										imageUrl: p.image_front_small_url || null
									};
								});
							
							if (uniqueOffProducts.length > 0) {
								send(uniqueOffProducts);
							}
						})
						.catch(err => console.error(`Error fetching ${brand}:`, err));
				});

				await Promise.all(offSearchPromises);

			} catch (error) {
				console.error('[Search Stream Error]', error);
				const errorMessage = error instanceof Error ? error.message : 'Unknown stream error';
				controller.enqueue(`error: ${JSON.stringify({ message: errorMessage })}\n\n`);
			} finally {
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
};
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
				type: 'custom' | 'product';
				imageUrl: string | null;
			};

			// Función para enviar eventos con nombre al stream
			const sendEvent = (event: string, data: object) => {
				controller.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
			};

			try {
				// 1. Búsqueda local (rápida)
				const { customIngredients, cachedProducts } = await ingredientService.searchByName(query);
				const localResults: SearchResult[] = [
					...customIngredients.map(
						(i) =>
							({
								id: i.id,
								name: i.name,
								source: 'local',
								type: 'custom',
								imageUrl: null
							}) as const
					),
					...cachedProducts.map(
						(p) =>
							({
								id: p.id,
								name: p.name,
								source: 'local',
								type: 'product',
								imageUrl: p.imageUrl
							}) as const
					)
				];

				if (localResults.length > 0) {
					localResults.forEach((r) => localIds.add(r.id));
					sendEvent('message', localResults);
				}

				// 2. Búsquedas externas (lentas)
				const brands = ['Hacendado', 'Mercadona'];
				const offSearchPromises = brands.map((brand) => {
					const offQuery = `${query} ${brand}`;
					const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
						offQuery
					)}&search_simple=1&action=process&json=1&page_size=10`;

					return fetch(offUrl)
						.then(async (res) => {
							if (!res.ok) throw new Error(`API returned status ${res.status}`);
							return res.json() as Promise<{ products: OffProduct[] }>;
						})
						.then((response) => {
							const offProducts = response.products || [];
							const uniqueOffProducts: SearchResult[] = offProducts
								.filter((p) => p.code && !localIds.has(p.code))
								.map((p) => {
									localIds.add(p.code);
									return {
										id: p.code,
										name: p.product_name,
										source: 'off' as const,
										type: 'product' as const,
										imageUrl: p.image_front_small_url || null
									};
								});

							if (uniqueOffProducts.length > 0) {
								sendEvent('message', uniqueOffProducts);
							}
						})
						.catch((err) => {
							// Lanzar el error para que Promise.allSettled lo capture
							throw new Error(`Failed to fetch from ${brand}: ${err.message}`);
						});
				});

				const results = await Promise.allSettled(offSearchPromises);
				results.forEach((result) => {
					if (result.status === 'rejected') {
						console.error('A fetch promise was rejected:', result.reason);
						sendEvent('stream_error', { source: 'off-api', message: result.reason.message });
					}
				});

			} catch (error) {
				console.error('[Search Stream Error]', error);
				const errorMessage = error instanceof Error ? error.message : 'Unknown stream error';
				sendEvent('stream_error', { source: 'server', message: errorMessage });
			} finally {
				// Notificar al cliente que el stream ha finalizado
				sendEvent('close', { message: 'Stream closed' });
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
import { ingredientService } from '$lib/server/services/ingredientService';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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

	const abortController = new AbortController();

	const stream = new ReadableStream({
		async start(controller) {
			const sentProductIds = new Set<string>();

			type SearchResult = {
				id: string; // CUID for local, barcode for OFF
				name: string;
				source: 'local' | 'off';
				imageUrl: string | null;
			};

			const sendEvent = (event: string, data: object) => {
				try {
					controller.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
				} catch (e) {
					console.warn(`Stream enqueue failed: ${(e as Error).message}`);
				}
			};

			try {
				// 1. Búsqueda local unificada
				const localProducts = await ingredientService.searchByName(query);
				if (localProducts.length > 0) {
					const localResults: SearchResult[] = localProducts.map((p) => {
						sentProductIds.add(p.id); // Guardamos el CUID
						if (p.barcode) sentProductIds.add(p.barcode); // Y también el barcode si existe
						return {
							id: p.id,
							name: p.name,
							source: 'local',
							imageUrl: p.imageUrl
						};
					});
					sendEvent('message', localResults);
				}

				// 2. Búsqueda externa en OpenFoodFacts
				const brands = ['Hacendado', 'Mercadona'];
				const offSearchPromises = brands.map((brand) => {
					const offQuery = `${query} ${brand}`;
					const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
						offQuery
					)}
&search_simple=1&action=process&json=1&page_size=10`;

					return fetch(offUrl, { signal: abortController.signal })
						.then(async (res) => {
							if (!res.ok) throw new Error(`API returned status ${res.status}`);
							return res.json();
						})
						.then((response) => {
							// CORRECCIÓN: Asegurarse de que response.products es un array antes de usarlo.
							const offProducts = 
								response && Array.isArray(response.products) ? response.products : [];

							const uniqueOffProducts: SearchResult[] = offProducts
								.filter((p: OffProduct) => p.code && !sentProductIds.has(p.code))
								.map((p: OffProduct) => {
									sentProductIds.add(p.code);
									return {
										id: p.code, // El ID para OFF es su código de barras
										name: p.product_name,
										source: 'off' as const,
										imageUrl: p.image_front_small_url || null
									};
								});

								if (uniqueOffProducts.length > 0) {
									sendEvent('message', uniqueOffProducts);
								}
						})
						.catch((err) => {
							if (err.name !== 'AbortError') {
								console.error(`Failed to fetch from ${brand}: ${err.message}`);
								sendEvent('stream_error', {
									source: 'off-api',
									message: `Error con la marca ${brand}`
								});
							}
						});
				});

				await Promise.allSettled(offSearchPromises);
			} catch (error) {
				if (error instanceof Error && error.name !== 'AbortError') {
					console.error('[Search Stream Error]', error);
					const errorMessage = error instanceof Error ? error.message : 'Unknown stream error';
					sendEvent('stream_error', { source: 'server', message: errorMessage });
				}
			} finally {
				sendEvent('close', { message: 'Stream closed' });
				if (!abortController.signal.aborted) {
					controller.close();
				}
			}
		},
		cancel(reason) {
			console.log('Stream cancelled by client.', reason);
			abortController.abort(reason);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};

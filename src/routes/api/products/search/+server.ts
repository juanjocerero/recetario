import { productService } from '$lib/server/services/productService';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Product } from '@prisma/client';

type OffProduct = {
	code: string;
	product_name: string;
	image_front_small_url?: string;
	nutriments: {
		'energy-kcal_100g'?: number;
		'proteins_100g'?: number;
		'fat_100g'?: number;
		'carbohydrates_100g'?: number;
	};
};

export const GET: RequestHandler = ({ url, fetch }) => {
	const query = url.searchParams.get('q');
	const page = url.searchParams.get('page') ?? '1';

	if (!query) {
		return json({ error: 'Query parameter "q" is required' }, { status: 400 });
	}

	const abortController = new AbortController();

	const stream = new ReadableStream({
		async start(controller) {
			type SearchResult = {
				id: string;
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
				// 1. Búsqueda en la base de datos local
				const localResults = await productService.searchByName(query);
				const localBarcodes = new Set<string>();

				if (localResults.length > 0) {
					const formattedLocalResults: SearchResult[] = localResults.map((p: Product) => {
						if (p.barcode) localBarcodes.add(p.barcode);
						return {
							id: p.id,
							name: p.name,
							source: 'local',
							imageUrl: p.imageUrl
						};
					});
					sendEvent('message', formattedLocalResults);
				}

				// 2. Búsqueda externa en OpenFoodFacts
				const brands = ['Hacendado', 'Mercadona'];
				const offSearchPromises = brands.map((brand) => {
					const offQuery = `${query} ${brand}`;
					const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
						offQuery
					)}
&search_simple=1&action=process&json=1&page_size=20&page=${page}&fields=code,product_name,image_front_small_url,nutriments`;

					return fetch(offUrl, { signal: abortController.signal })
						.then((res) => {
							if (!res.ok) throw new Error(`API returned status ${res.status}`);
							return res.json();
						})
						.then((response) => {
							const offProducts = response?.products ?? [];
							const uniqueOffProducts: SearchResult[] = offProducts
								.filter((p: OffProduct) => p.code && !localBarcodes.has(p.code))
								.map((p: OffProduct) => {
									localBarcodes.add(p.code); // Evita duplicados en la misma sesión de búsqueda
									return {
										id: p.code,
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
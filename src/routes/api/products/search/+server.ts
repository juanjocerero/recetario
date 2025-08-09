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
				source: 'off';
				imageUrl: string | null;
				calories: number;
				protein: number;
				fat: number;
				carbs: number;
			};

			const sendEvent = (event: string, data: object) => {
				try {
					controller.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
				} catch (e) {
					console.warn(`Stream enqueue failed: ${(e as Error).message}`);
				}
			};

			try {
				// 1. Obtener todos los barcodes de la base de datos local para filtrar resultados
				const allLocalProducts = await productService.getAll();
				const localBarcodes = new Set(allLocalProducts.map((p: Product) => p.barcode).filter(Boolean));

				// 2. Búsqueda externa en OpenFoodFacts
				const brands = ['Hacendado', 'Mercadona'];
				const offSearchPromises = brands.map((brand) => {
					const offQuery = `${query} ${brand}`;
					const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
						offQuery
					)}&search_simple=1&action=process&json=1&page_size=20&page=${page}&fields=code,product_name,image_front_small_url,nutriments`;

					return fetch(offUrl, { signal: abortController.signal })
						.then(async (res) => {
							if (!res.ok) throw new Error(`API returned status ${res.status}`);
							return res.json();
						})
						.then((response) => {
							const offProducts = 
								response && Array.isArray(response.products) ? response.products : [];

							const uniqueOffProducts: SearchResult[] = offProducts
								.filter((p: OffProduct) => p.code && !localBarcodes.has(p.code))
								.map((p: OffProduct) => {
									// Añadimos el barcode al set para evitar duplicados entre las propias llamadas a OFF
									localBarcodes.add(p.code);
									return {
										id: p.code, // El ID para OFF es su código de barras
										name: p.product_name,
										source: 'off' as const,
										imageUrl: p.image_front_small_url || null,
										calories: p.nutriments?.['energy-kcal_100g'] ?? 0,
										protein: p.nutriments?.['proteins_100g'] ?? 0,
										fat: p.nutriments?.['fat_100g'] ?? 0,
										carbs: p.nutriments?.['carbohydrates_100g'] ?? 0
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

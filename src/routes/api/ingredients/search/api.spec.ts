import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { ingredientService } from '$lib/server/services/ingredientService';

// Mockear los módulos externos
vi.mock('$lib/server/services/ingredientService', () => ({
	ingredientService: {
		searchByName: vi.fn()
	}
}));

vi.mock('@sveltejs/kit', async (importOriginal) => {
	const original = await importOriginal<typeof import('@sveltejs/kit')>();
	return {
		...original,
		json: vi.fn((data, init) => new Response(JSON.stringify(data), init))
	};
});

type ApiEvent = Parameters<typeof GET>[0];

// Helper para consumir el stream y obtener los resultados como un array
async function consumeStream(stream: ReadableStream | null) {
	if (!stream) return [];
	const reader = stream.getReader();
	const results = [];

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		// Justificación: En el entorno de test de Node.js, el valor del stream
		// ya es un string. Se elimina el TextDecoder para evitar el error de tipo,
		// tratando el chunk directamente como texto.
		const chunk = value.toString();
		const lines = chunk.split('\n\n').filter(Boolean);

		for (const line of lines) {
			if (line.startsWith('event: message')) {
				const data = JSON.parse(line.split('data: ')[1]);
				results.push(...data);
			}
		}
	}
	return results;
}

describe('API Endpoint: /api/ingredients/search', () => {
	const mockSearchByName = vi.mocked(ingredientService.searchByName);

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('debe devolver resultados locales del ingredientService', async () => {
		const mockLocalResults = {
			customIngredients: [
				{
					id: 'custom1',
					name: 'Tomate de la huerta',
					normalizedName: 'tomate de la huerta',
					calories: 22,
					fat: 0.2,
					protein: 0.9,
					carbs: 3.9
				}
			],
			cachedProducts: [
				{
					id: 'prod1',
					name: 'Tomate Frito (Mercadona)',
					normalizedName: 'tomate frito (mercadona)',
					brand: 'Hacendado',
					imageUrl: 'url_image',
					calories: 77,
					fat: 3.5,
					protein: 1.5,
					carbs: 8.5,
					fullPayload: {},
					createdAt: new Date(),
					updatedAt: new Date()
				}
			]
		};
		mockSearchByName.mockResolvedValue(mockLocalResults);

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ products: [] })
		});

		const url = new URL('http://localhost/api/ingredients/search?q=tomate');
		const response = await GET({ url, fetch: mockFetch } as unknown as ApiEvent);
		const result = await consumeStream(response.body as ReadableStream);

		expect(mockSearchByName).toHaveBeenCalledWith('tomate');
		expect(result).toContainEqual({
			id: 'custom1',
			name: 'Tomate de la huerta',
			source: 'local',
			type: 'custom',
			imageUrl: null
		});
		expect(result).toContainEqual({
			id: 'prod1',
			name: 'Tomate Frito (Mercadona)',
			source: 'local',
			type: 'product',
			imageUrl: 'url_image'
		});
	});

	it('debe llamar a la API de Open Food Facts con "Hacendado" y "Mercadona" añadido a la query', async () => {
		mockSearchByName.mockResolvedValue({ customIngredients: [], cachedProducts: [] });
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ products: [] })
		});
		const url = new URL('http://localhost/api/ingredients/search?q=queso');

		const response = await GET({ url, fetch: mockFetch } as unknown as ApiEvent);
		await consumeStream(response.body as ReadableStream);

		expect(mockFetch).toHaveBeenCalledTimes(2);
		const fetchUrl1 = mockFetch.mock.calls[0][0] as string;
		const fetchUrl2 = mockFetch.mock.calls[1][0] as string;
		expect(fetchUrl1).toContain('search_terms=queso%20Hacendado');
		expect(fetchUrl2).toContain('search_terms=queso%20Mercadona');
	});

	it('debe unificar resultados y eliminar duplicados dando prioridad a los locales', async () => {
		const mockLocalResults = {
			customIngredients: [],
			cachedProducts: [
				{
					id: '12345',
					name: 'Producto Local Repetido',
					normalizedName: 'producto local repetido',
					brand: 'Local',
					imageUrl: null,
					calories: 1,
					fat: 1,
					protein: 1,
					carbs: 1,
					fullPayload: {},
					createdAt: new Date(),
					updatedAt: new Date()
				}
			]
		};
		mockSearchByName.mockResolvedValue(mockLocalResults);

		const mockOffResponse = {
			products: [
				{ code: '12345', product_name: 'Producto OFF Repetido', image_front_small_url: 'url1' },
				{ code: '67890', product_name: 'Producto OFF Único', image_front_small_url: 'url2' }
			]
		};
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockOffResponse)
		});
		const url = new URL('http://localhost/api/ingredients/search?q=producto');

		const response = await GET({ url, fetch: mockFetch } as unknown as ApiEvent);
		const result = await consumeStream(response.body as ReadableStream);

		expect(result).toHaveLength(2);
		expect(result).toContainEqual({
			id: '12345',
			name: 'Producto Local Repetido',
			source: 'local',
			type: 'product',
			imageUrl: null
		});
		expect(result).toContainEqual({
			id: '67890',
			name: 'Producto OFF Único',
			source: 'off',
			type: 'product',
			imageUrl: 'url2'
		});
	});

	it('debe devolver un error 400 si no se proporciona el parámetro "q"', async () => {
		const url = new URL('http://localhost/api/ingredients/search');
		const mockFetch = vi.fn();

		const response = await GET({ url, fetch: mockFetch } as unknown as ApiEvent);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe('Query parameter "q" is required');
	});
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { ingredientService } from '$lib/server/services/ingredientService';
import { json } from '@sveltejs/kit';

// Mockear los módulos externos
vi.mock('$lib/server/services/ingredientService', () => ({
	ingredientService: {
		searchByName: vi.fn()
	}
}));

vi.mock('@sveltejs/kit', async () => {
	const actual = await vi.importActual('@sveltejs/kit');
	return {
		...actual,
		json: vi.fn((data, init) => new Response(JSON.stringify(data), init))
	};
});

// Helper para consumir el stream y obtener los resultados como un array
async function consumeStream(stream: ReadableStream | null) {
	if (!stream) return [];
	const reader = stream.getReader();
	const results = [];

	// Mockear TextDecoder para el entorno de prueba de Node.js
	global.TextDecoder = class TextDecoder {
		decode(chunk: any) {
			return chunk.toString();
		}
	} as any;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		// En el entorno de prueba, los chunks pueden no ser Uint8Array.
		// Los tratamos como texto y procesamos el formato SSE.
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
	const mockJsonResponse = vi.mocked(json);

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('debe devolver resultados locales del ingredientService', async () => {
		// Arrange
		const mockLocalResults = {
			customIngredients: [{ id: 'custom1', name: 'Tomate de la huerta' }],
			cachedProducts: [{ id: 'prod1', name: 'Tomate Frito (Mercadona)', imageUrl: 'url_image' }]
		};
		mockSearchByName.mockResolvedValue(mockLocalResults);

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ products: [] })
		});

		const request = { url: new URL('http://localhost/api/ingredients/search?q=tomate') };

		// Act
		const response = await GET({ url: request.url, fetch: mockFetch } as any);
		const result = await consumeStream(response.body as ReadableStream);

		// Assert
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
		// Arrange
		mockSearchByName.mockResolvedValue({ customIngredients: [], cachedProducts: [] });
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ products: [] })
		});
		const request = { url: new URL('http://localhost/api/ingredients/search?q=queso') };

		// Act
		const response = await GET({ url: request.url, fetch: mockFetch } as any);
		await consumeStream(response.body as ReadableStream); // Consumir para que se ejecute

		// Assert
		expect(mockFetch).toHaveBeenCalledTimes(2);
		const fetchUrl1 = mockFetch.mock.calls[0][0] as string;
		const fetchUrl2 = mockFetch.mock.calls[1][0] as string;
		expect(fetchUrl1).toContain('search_terms=queso%20Hacendado');
		expect(fetchUrl2).toContain('search_terms=queso%20Mercadona');
	});

	it('debe unificar resultados y eliminar duplicados dando prioridad a los locales', async () => {
		// Arrange
		const mockLocalResults = {
			customIngredients: [],
			cachedProducts: [{ id: '12345', name: 'Producto Local Repetido', imageUrl: null }]
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
		const request = { url: new URL('http://localhost/api/ingredients/search?q=producto') };

		// Act
		const response = await GET({ url: request.url, fetch: mockFetch } as any);
		const result = await consumeStream(response.body as ReadableStream);

		// Assert
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
		expect(result.find((r) => r.id === '12345' && r.source === 'off')).toBeUndefined();
	});

	it('debe devolver un error 400 si no se proporciona el parámetro "q"', async () => {
		// Arrange
		const request = { url: new URL('http://localhost/api/ingredients/search') };
		const mockFetch = vi.fn();

		// Act
		const response = await GET({ url: request.url, fetch: mockFetch } as any);

		// Assert
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe('Query parameter "q" is required');
	});
});

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
		json: vi.fn((data) => data) // Mock simple que devuelve los datos
	};
});

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
		const result = await GET({ url: request.url, fetch: mockFetch } as any);

		// Assert
		expect(mockSearchByName).toHaveBeenCalledWith('tomate');
		expect(result).toContainEqual({
			id: 'custom1',
			name: 'Tomate de la huerta',
			source: 'local',
			imageUrl: null
		});
		expect(result).toContainEqual({
			id: 'prod1',
			name: 'Tomate Frito (Mercadona)',
			source: 'local',
			imageUrl: 'url_image'
		});
	});

	it('debe llamar a la API de Open Food Facts con " Mercadona" añadido a la query', async () => {
		// Arrange
		mockSearchByName.mockResolvedValue({ customIngredients: [], cachedProducts: [] });
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ products: [] })
		});
		const request = { url: new URL('http://localhost/api/ingredients/search?q=queso') };

		// Act
		await GET({ url: request.url, fetch: mockFetch } as any);

		// Assert
		expect(mockFetch).toHaveBeenCalledOnce();
		const fetchUrl = mockFetch.mock.calls[0][0] as string;
		expect(fetchUrl).toContain('search_terms=queso%20Mercadona');
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
		const result = await GET({ url: request.url, fetch: mockFetch } as any);

		// Assert
		expect(result).toHaveLength(2);
		// Comprueba que el resultado local está presente
		expect(result).toContainEqual({
			id: '12345',
			name: 'Producto Local Repetido',
			source: 'local',
			imageUrl: null
		});
		// Comprueba que el resultado único de OFF está presente
		expect(result).toContainEqual({
			id: '67890',
			name: 'Producto OFF Único',
			source: 'off',
			imageUrl: 'url2'
		});
		// Comprueba que el resultado duplicado de OFF NO está presente
		expect(result.find((r) => r.id === '12345' && r.source === 'off')).toBeUndefined();
	});

	it('debe devolver un error 400 si no se proporciona el parámetro "q"', async () => {
		// Arrange
		const request = { url: new URL('http://localhost/api/ingredients/search') };
		const mockFetch = vi.fn();

		// Act
		await GET({ url: request.url, fetch: mockFetch } as any);

		// Assert
		expect(mockJsonResponse).toHaveBeenCalledWith(
			{ error: 'Query parameter "q" is required' },
			{ status: 400 }
		);
	});
});

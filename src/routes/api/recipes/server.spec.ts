// Fichero: src/routes/api/recipes/+server.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { recipeService } from '$lib/server/services/recipeService';
import { json } from '@sveltejs/kit';

vi.mock('$lib/server/services/recipeService');

vi.mock('@sveltejs/kit', async (importOriginal) => {
	const original = await importOriginal<typeof import('@sveltejs/kit')>();
	return {
		...original,
		json: vi.fn()
	};
});

type ApiEvent = Parameters<typeof GET>[0];
type Recipes = Awaited<ReturnType<typeof recipeService.findPaginated>>;

describe('GET /api/recipes', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should call recipeService.findPaginated with correct default parameters', async () => {
		// Justificación: Se añade un mock de retorno para evitar el TypeError.
		// El test se centra en verificar los argumentos de la llamada, no el resultado.
		vi.mocked(recipeService.findPaginated).mockResolvedValue([]);

		const url = new URL('http://localhost/api/recipes');
		await GET({ url } as unknown as ApiEvent);

		expect(recipeService.findPaginated).toHaveBeenCalledWith(null, 51, 0);
	});

	it('should call recipeService.findPaginated with provided query parameters', async () => {
		// Justificación: Se añade un mock de retorno para evitar el TypeError.
		vi.mocked(recipeService.findPaginated).mockResolvedValue([]);

		const url = new URL('http://localhost/api/recipes?q=pollo&limit=10&offset=20');
		await GET({ url } as unknown as ApiEvent);

		expect(recipeService.findPaginated).toHaveBeenCalledWith('pollo', 11, 20);
	});

	it('should return hasMore: true when the service returns more items than the limit', async () => {
		const url = new URL('http://localhost/api/recipes?limit=10');
		const mockRecipes = Array(11).fill({ id: '1' });
		vi.mocked(recipeService.findPaginated).mockResolvedValue(mockRecipes as Recipes);

		await GET({ url } as unknown as ApiEvent);

		expect(json).toHaveBeenCalledWith({
			recipes: mockRecipes.slice(0, 10),
			hasMore: true
		});
	});

	it('should return hasMore: false when the service returns fewer items than the limit', async () => {
		const url = new URL('http://localhost/api/recipes?limit=10');
		const mockRecipes = Array(5).fill({ id: '1' });
		vi.mocked(recipeService.findPaginated).mockResolvedValue(mockRecipes as Recipes);

		await GET({ url } as unknown as ApiEvent);

		expect(json).toHaveBeenCalledWith({
			recipes: mockRecipes,
			hasMore: false
		});
	});

	it('should return a 500 error if the service throws an exception', async () => {
		const url = new URL('http://localhost/api/recipes');
		vi.mocked(recipeService.findPaginated).mockRejectedValue(new Error('Database error'));

		vi.spyOn(console, 'error').mockImplementation(() => {});

		await GET({ url } as unknown as ApiEvent);

		expect(json).toHaveBeenCalledWith({ message: 'Error interno del servidor' }, { status: 500 });

		vi.mocked(console.error).mockRestore();
	});
});

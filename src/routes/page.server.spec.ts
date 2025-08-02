// Fichero: src/routes/page.server.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { load, actions } from './+page.server';
import { recipeService } from '$lib/server/services/recipeService';
import { fail } from '@sveltejs/kit';

vi.mock('$lib/server/services/recipeService');

type PageServerLoadEvent = Parameters<typeof load>[0];
type ActionEvent = Parameters<typeof actions.delete>[0];
type Recipes = Awaited<ReturnType<typeof recipeService.findPaginated>>;

// Justificación: Se define explícitamente la estructura del tipo devuelto por `load`.
// La inferencia automática (`Awaited<ReturnType<typeof load>>`) falla debido a los
// genéricos complejos de SvelteKit, por lo que un tipo explícito es más robusto.
interface LoadResult {
	recipes: Recipes;
	hasMore: boolean;
}

describe('+page.server', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('load', () => {
		it('should call findPaginated and return recipes with hasMore: true', async () => {
			const mockRecipes = Array(51).fill({ id: '1', title: 'Receta' });
			vi.mocked(recipeService.findPaginated).mockResolvedValue(mockRecipes as Recipes);

			const result = (await load({} as unknown as PageServerLoadEvent)) as LoadResult;

			expect(recipeService.findPaginated).toHaveBeenCalledWith(null, 51, 0);
			expect(result.recipes).toHaveLength(50);
			expect(result.hasMore).toBe(true);
		});

		it('should call findPaginated and return recipes with hasMore: false', async () => {
			const mockRecipes = Array(30).fill({ id: '1', title: 'Receta' });
			vi.mocked(recipeService.findPaginated).mockResolvedValue(mockRecipes as Recipes);

			const result = (await load({} as unknown as PageServerLoadEvent)) as LoadResult;

			expect(recipeService.findPaginated).toHaveBeenCalledWith(null, 51, 0);
			expect(result.recipes).toHaveLength(30);
			expect(result.hasMore).toBe(false);
		});
	});

	describe('actions.delete', () => {
		beforeEach(() => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
		});

		afterEach(() => {
			vi.mocked(console.error).mockRestore();
		});

		it('should call recipeService.deleteById with the correct id on success', async () => {
			const formData = new FormData();
			formData.append('id', 'recipe-to-delete');
			const mockRequest = {
				formData: async () => formData
			};
			await actions.delete({ request: mockRequest } as unknown as ActionEvent);
			expect(recipeService.deleteById).toHaveBeenCalledWith('recipe-to-delete');
		});

		it('should return a 400 fail if the id is missing', async () => {
			const formData = new FormData();
			const mockRequest = {
				formData: async () => formData
			};
			const result = await actions.delete({ request: mockRequest } as unknown as ActionEvent);
			expect(recipeService.deleteById).not.toHaveBeenCalled();
			expect(result).toEqual(fail(400, { message: 'ID de receta no válido' }));
		});

		it('should return a 500 fail if recipeService.deleteById throws an error', async () => {
			const formData = new FormData();
			formData.append('id', 'recipe-that-fails');
			const mockRequest = {
				formData: async () => formData
			};
			const testError = new Error('Database connection failed');
			vi.mocked(recipeService.deleteById).mockRejectedValue(testError);
			const result = await actions.delete({ request: mockRequest } as unknown as ActionEvent);
			expect(recipeService.deleteById).toHaveBeenCalledWith('recipe-that-fails');
			expect(result).toEqual(
				fail(500, { message: 'No se pudo eliminar la receta. Por favor, inténtelo de nuevo.' })
			);
		});
	});
});
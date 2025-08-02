// Fichero: src/routes/page.server.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { load, actions } from './+page.server';
import { recipeService } from '$lib/server/services/recipeService';
import { fail } from '@sveltejs/kit';

vi.mock('$lib/server/services/recipeService');

type PageServerLoadEvent = Parameters<typeof load>[0];
type ActionEvent = Parameters<typeof actions.delete>[0];
type Recipes = Awaited<ReturnType<typeof recipeService.getAll>>;

describe('+page.server', () => {
	const mockRecipes: Partial<Recipes[number]>[] = [
		{ id: '1', title: 'Receta 1', ingredients: [] },
		{ id: '2', title: 'Receta 2', ingredients: [] }
	];

	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('load', () => {
		it('should call recipeService.getAll and return the recipes', async () => {
			vi.mocked(recipeService.getAll).mockResolvedValue(mockRecipes as Recipes);
			const result = await load({} as unknown as PageServerLoadEvent);
			expect(recipeService.getAll).toHaveBeenCalledOnce();
			expect(result).toEqual({ recipes: mockRecipes });
		});
	});

	describe('actions.delete', () => {
		// Justificación: Se espía y silencia `console.error` antes de cada test
		// de este bloque para evitar el ruido en la salida del test que
		// comprueba el manejo de errores.
		beforeEach(() => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
		});

		// Justificación: Se restaura la función original de `console.error`
		// después de cada test para no afectar a otras suites de tests.
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

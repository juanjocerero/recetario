// Ruta: src/lib/server/services/ingredientService.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import prisma from '$lib/server/prisma';
import { ingredientService } from './ingredientService';
import type { Ingredient } from '$lib/schemas/ingredientSchema';
import { normalizeText } from '$lib/utils';

// Justificación: Mockeamos el módulo de Prisma para aislar el servicio de la base de datos.
// `vi.mock` reemplaza las exportaciones del módulo con mocks, permitiéndonos controlar
// el comportamiento de `prisma.customIngredient.create` y otras funciones de Prisma durante el test.
vi.mock('$lib/server/prisma', () => {
	return {
		default: {
			customIngredient: {
				findMany: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			product: {
				findMany: vi.fn(),
				update: vi.fn()
			}
		}
	};
});

// Mockeamos fetch globalmente para interceptar las llamadas a la API de OFF
global.fetch = vi.fn();

describe('ingredientService', () => {
	// Limpiamos los mocks antes de cada test para asegurar que no haya interferencias entre pruebas.
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers(); // Restauramos los temporizadores reales después de cada test
	});

	it('debería llamar a prisma.customIngredient.create con los datos correctos', async () => {
		// 1. Arrange (Preparación)
		const newIngredientData: Ingredient = {
			name: 'Harina de Almendras',
			calories: 579,
			protein: 21.1,
			fat: 49.9,
			carbs: 21.6
		};

		const expectedResult = {
			id: 'clxmjm8om0000v9a1b2c3d4e5',
			...newIngredientData
		};

		// Configuramos el mock para que devuelva un valor específico cuando se llame.
		vi.mocked(prisma.customIngredient.create).mockResolvedValue(expectedResult);

		// 2. Act (Actuación)
		const result = await ingredientService.create(newIngredientData);

		// 3. Assert (Verificación)
		// Verificamos que la función 'create' de prisma fue llamada exactamente una vez.
		expect(prisma.customIngredient.create).toHaveBeenCalledTimes(1);

		// Verificamos que la función 'create' de prisma fue llamada con el objeto de datos correcto.
		expect(prisma.customIngredient.create).toHaveBeenCalledWith({
			data: {
				...newIngredientData,
				normalizedName: 'harina de almendras' // Justificación: Añadimos el campo esperado.
			}
		});

		// Verificamos que el resultado de nuestro servicio es el que esperábamos.
		expect(result).toEqual(expectedResult);
	});

	describe('syncWithOpenFoodFacts', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('debería actualizar un producto cuando los datos de OFF son diferentes', async () => {
			// Arrange
			const mockProduct = {
				id: '12345',
				name: 'Old Name',
				brand: 'Old Brand',
				calories: 100,
				fat: 10,
				protein: 10,
				carbs: 10,
				imageUrl: 'old_url',
				normalizedName: 'old name',
				fullPayload: {}
			};
			vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct]);

			const offApiResponse = {
				status: 1,
				product: {
					product_name: 'New Name',
					brands: 'New Brand',
					nutriments: {
						'energy-kcal_100g': 200,
						fat_100g: 20,
						proteins_100g: 20,
						carbohydrates_100g: 20
					},
					image_url: 'new_url'
				}
			};
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => offApiResponse
			} as Response);

			// Act
			const promise = ingredientService.syncWithOpenFoodFacts();
			await vi.runAllTimersAsync();
			const result = await promise;

			// Assert
			expect(prisma.product.update).toHaveBeenCalledTimes(1);
			expect(prisma.product.update).toHaveBeenCalledWith({
				where: { id: '12345' },
				data: {
					name: 'New Name',
					normalizedName: 'new name',
					brand: 'New Brand',
					imageUrl: 'new_url',
					calories: 200,
					fat: 20,
					protein: 20,
					carbs: 20,
					fullPayload: offApiResponse.product
				}
			});
			expect(result.updatedIngredients).toEqual(['Old Name']);
			expect(result.failedIngredients).toEqual([]);
		});

		it('NO debería actualizar un producto si los datos son idénticos', async () => {
			// Arrange
			const mockProduct = {
				id: '12345',
				name: 'Same Name',
				brand: 'Same Brand',
				calories: 100,
				fat: 10,
				protein: 10,
				carbs: 10,
				imageUrl: 'same_url',
				normalizedName: 'same name',
				fullPayload: {}
			};
			vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct]);

			const offApiResponse = {
				status: 1,
				product: {
					product_name: 'Same Name',
					brands: 'Same Brand',
					nutriments: {
						'energy-kcal_100g': 100,
						fat_100g: 10,
						proteins_100g: 10,
						carbohydrates_100g: 10
					},
					image_url: 'same_url'
				}
			};
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => offApiResponse
			} as Response);

			// Act
			const promise = ingredientService.syncWithOpenFoodFacts();
			await vi.runAllTimersAsync();
			const result = await promise;

			// Assert
			expect(prisma.product.update).not.toHaveBeenCalled();
			expect(result.updatedIngredients).toEqual([]);
			expect(result.failedIngredients).toEqual([]);
		});

		it('debería registrar un fallo si la API de OFF devuelve un error', async () => {
			// Arrange
			const mockProduct = { id: '12345', name: 'Failing Product' };
			vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct as any]);

			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			} as Response);

			// Act
			const promise = ingredientService.syncWithOpenFoodFacts();
			await vi.runAllTimersAsync();
			const result = await promise;

			// Assert
			expect(prisma.product.update).not.toHaveBeenCalled();
			expect(result.updatedIngredients).toEqual([]);
			expect(result.failedIngredients).toEqual([
				{ id: '12345', name: 'Failing Product', reason: 'Error 500: Internal Server Error' }
			]);
		});

		it('debería registrar un fallo si el producto no se encuentra en OFF', async () => {
			// Arrange
			const mockProduct = { id: '12345', name: 'Not Found Product' };
			vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct as any]);

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({ status: 0 }) // status: 0 indica no encontrado
			} as Response);

			// Act
			const promise = ingredientService.syncWithOpenFoodFacts();
			await vi.runAllTimersAsync();
			const result = await promise;

			// Assert
			expect(result.failedIngredients).toEqual([
				{
					id: '12345',
					name: 'Not Found Product',
					reason: 'Producto no encontrado en Open Food Facts'
				}
			]);
		});
	});
});

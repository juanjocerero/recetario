// Ruta: src/lib/server/services/ingredientService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '$lib/server/prisma';
import { ingredientService } from './ingredientService';
import type { Ingredient } from '$lib/schemas/ingredientSchema';

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
			}
		}
	};
});

describe('ingredientService', () => {
	// Limpiamos los mocks antes de cada test para asegurar que no haya interferencias entre pruebas.
	beforeEach(() => {
		vi.clearAllMocks();
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

	// Aquí se podrían añadir más tests para getAll, update y deleteById...
});

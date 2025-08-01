// Ruta: src/lib/recipeCalculator.spec.ts
import { describe, it, expect } from 'vitest';
import { calculateNutritionalInfo, type CalculableIngredient } from './recipeCalculator';

// Justificación: Se testea la función `calculateNutritionalInfo` de forma aislada (test unitario).
// Al ser una función pura, podemos pasarle datos de entrada controlados y verificar
// que la salida sea predecible y correcta, garantizando la fiabilidad del cálculo.

describe('calculateNutritionalInfo', () => {
	it('should calculate the total nutritional info for a list of ingredients correctly', () => {
		const ingredients: CalculableIngredient[] = [
			{ quantity: 200, calories: 100, protein: 10, fat: 5, carbs: 20 }, // Pollo
			{ quantity: 150, calories: 50, protein: 2, fat: 1, carbs: 10 } // Arroz
		];

		const result = calculateNutritionalInfo(ingredients);

		// 200g de Pollo: 200 cal, 20p, 10g, 40c
		// 150g de Arroz: 75 cal, 3p, 1.5g, 15c
		// Total: 275 cal, 23p, 11.5g, 55c
		expect(result.totalCalories).toBe(275);
		expect(result.totalProtein).toBe(23);
		expect(result.totalFat).toBe(11.5);
		expect(result.totalCarbs).toBe(55);
	});

	it('should return all zeros if the ingredient list is empty', () => {
		const ingredients: CalculableIngredient[] = [];
		const result = calculateNutritionalInfo(ingredients);

		expect(result.totalCalories).toBe(0);
		expect(result.totalProtein).toBe(0);
		expect(result.totalFat).toBe(0);
		expect(result.totalCarbs).toBe(0);
	});

	it('should handle ingredients with null or missing nutritional values gracefully', () => {
		const ingredients: CalculableIngredient[] = [
			{ quantity: 100, calories: 300, protein: 20, fat: 10, carbs: 5 },
			{ quantity: 50, calories: null, protein: 5, fat: undefined, carbs: 25 } // Ingrediente con datos incompletos
		];

		const result = calculateNutritionalInfo(ingredients);

		// 100g de Ing1: 300 cal, 20p, 10g, 5c
		// 50g de Ing2: 0 cal, 2.5p, 0g, 12.5c
		// Total: 300 cal, 22.5p, 10g, 17.5c
		expect(result.totalCalories).toBe(300);
		expect(result.totalProtein).toBe(22.5);
		expect(result.totalFat).toBe(10);
		expect(result.totalCarbs).toBe(17.5);
	});

	it('should handle rounding correctly to two decimal places', () => {
		const ingredients: CalculableIngredient[] = [
			{ quantity: 33, calories: 123, protein: 11.11, fat: 5.55, carbs: 22.22 }
		];

		const result = calculateNutritionalInfo(ingredients);

		// 33g de Ing1: 40.59 cal, 3.6663p, 1.8315g, 7.3326c
		// Redondeado: 40.59 cal, 3.67p, 1.83g, 7.33c
		expect(result.totalCalories).toBe(40.59);
		expect(result.totalProtein).toBe(3.67);
		expect(result.totalFat).toBe(1.83);
		expect(result.totalCarbs).toBe(7.33);
	});
});

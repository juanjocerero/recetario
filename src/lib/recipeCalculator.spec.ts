// Fichero: src/lib/recipeCalculator.spec.ts
import { describe, it, expect } from 'vitest';
import { calculateNutritionalInfo, type CalculableIngredient } from './recipeCalculator';

// Justificación: Se crea una suite de tests para la función `calculateNutritionalInfo`.
// El objetivo es asegurar la precisión de los cálculos nutricionales, que son una
// característica crítica de la aplicación.
describe('calculateNutritionalInfo', () => {
	// Test 1: Cálculo básico con datos completos.
	it('should calculate totals correctly for a list of standard ingredients', () => {
		const ingredients: CalculableIngredient[] = [
			{ quantity: 150, calories: 100, protein: 10, fat: 5, carbs: 20 }, // 1.5x
			{ quantity: 50, calories: 200, protein: 2, fat: 1, carbs: 40 } // 0.5x
		];
		const result = calculateNutritionalInfo(ingredients);
		expect(result.totalCalories).toBe(150 + 100); // 250
		expect(result.totalProtein).toBe(15 + 1); // 16
		expect(result.totalFat).toBe(7.5 + 0.5); // 8
		expect(result.totalCarbs).toBe(30 + 20); // 50
	});

	// Test 2: Manejo de un array de ingredientes vacío.
	it('should return all zeros when the ingredient list is empty', () => {
		const ingredients: CalculableIngredient[] = [];
		const result = calculateNutritionalInfo(ingredients);
		expect(result.totalCalories).toBe(0);
		expect(result.totalProtein).toBe(0);
		expect(result.totalFat).toBe(0);
		expect(result.totalCarbs).toBe(0);
	});

	// Test 3: Manejo de valores nulos o indefinidos.
	it('should treat null or undefined nutritional values as zero', () => {
		const ingredients: CalculableIngredient[] = [
			{ quantity: 100, calories: 100, protein: 10, fat: null, carbs: 20 },
			{ quantity: 100, calories: 50, protein: 5, fat: 5, carbs: undefined }
		];
		const result = calculateNutritionalInfo(ingredients);
		expect(result.totalCalories).toBe(150);
		expect(result.totalProtein).toBe(15);
		expect(result.totalFat).toBe(5); // Solo el segundo ingrediente aporta grasa.
		expect(result.totalCarbs).toBe(20); // Solo el primer ingrediente aporta carbohidratos.
	});

	// Test 4: Ingredientes con cantidad cero.
	it('should contribute nothing to the totals if an ingredient has zero quantity', () => {
		const ingredients: CalculableIngredient[] = [
			{ quantity: 100, calories: 100, protein: 10, fat: 10, carbs: 10 },
			{ quantity: 0, calories: 1000, protein: 100, fat: 100, carbs: 100 } // Este no debe contar.
		];
		const result = calculateNutritionalInfo(ingredients);
		expect(result.totalCalories).toBe(100);
		expect(result.totalProtein).toBe(10);
		expect(result.totalFat).toBe(10);
		expect(result.totalCarbs).toBe(10);
	});

	// Test 5: Precisión con números decimales.
	it('should handle floating point numbers correctly and round to 2 decimal places', () => {
		const ingredients: CalculableIngredient[] = [
			{ quantity: 125.5, calories: 88.5, protein: 5.25, fat: 2.75, carbs: 10.5 }
		];
		const result = calculateNutritionalInfo(ingredients);
		// (125.5 / 100) * 88.5 = 111.0675 -> 111.07
		expect(result.totalCalories).toBe(111.07);
		// (125.5 / 100) * 5.25 = 6.58875 -> 6.59
		expect(result.totalProtein).toBe(6.59);
		// (125.5 / 100) * 2.75 = 3.45125 -> 3.45
		expect(result.totalFat).toBe(3.45);
		// (125.5 / 100) * 10.5 = 13.1775 -> 13.18
		expect(result.totalCarbs).toBe(13.18);
	});
});
import { describe, it, expect } from 'vitest';
import { calculateNutritionalInfo, type CalculableProduct } from './recipeCalculator';

describe('calculateNutritionalInfo', () => {
	it('should return all zeros for an empty array', () => {
		expect(calculateNutritionalInfo([])).toEqual({
			totalCalories: 0,
			totalProtein: 0,
			totalFat: 0,
			totalCarbs: 0
		});
	});

	it('should calculate the nutritional info for a single product', () => {
		const products: CalculableProduct[] = [
			{
				quantity: 100,
				calories: 100,
				protein: 10,
				fat: 5,
				carbs: 20
			}
		];
		expect(calculateNutritionalInfo(products)).toEqual({
			totalCalories: 100,
			totalProtein: 10,
			totalFat: 5,
			totalCarbs: 20
		});
	});

	it('should calculate the nutritional info for multiple products', () => {
		const products: CalculableProduct[] = [
			{
				quantity: 100,
				calories: 100,
				protein: 10,
				fat: 5,
				carbs: 20
			},
			{
				quantity: 200,
				calories: 50,
				protein: 5,
				fat: 2.5,
				carbs: 10
			}
		];
		expect(calculateNutritionalInfo(products)).toEqual({
			totalCalories: 200,
			totalProtein: 20,
			totalFat: 10,
			totalCarbs: 40
		});
	});

	it('should handle products with missing nutritional info', () => {
		const products: CalculableProduct[] = [
			{
				quantity: 100,
				calories: 100,
				protein: 10
			},
			{
				quantity: 200,
				calories: 50,
				carbs: 10
			}
		];
		expect(calculateNutritionalInfo(products)).toEqual({
			totalCalories: 200,
			totalProtein: 10,
			totalFat: 0,
			totalCarbs: 20
		});
	});

	it('should handle products with a quantity of 0', () => {
		const products: CalculableProduct[] = [
			{
				quantity: 0,
				calories: 100,
				protein: 10,
				fat: 5,
				carbs: 20
			}
		];
		expect(calculateNutritionalInfo(products)).toEqual({
			totalCalories: 0,
			totalProtein: 0,
			totalFat: 0,
			totalCarbs: 0
		});
	});

	it('should handle quantities that result in fractional values', () => {
		const products: CalculableProduct[] = [
			{
				quantity: 50,
				calories: 123,
				protein: 12.5,
				fat: 5.5,
				carbs: 25.5
			}
		];
		expect(calculateNutritionalInfo(products)).toEqual({
			totalCalories: 61.5,
			totalProtein: 6.25,
			totalFat: 2.75,
			totalCarbs: 12.75
		});
	});

	it('should round the results to two decimal places', () => {
		const products: CalculableProduct[] = [
			{
				quantity: 33,
				calories: 100,
				protein: 10,
				fat: 10,
				carbs: 10
			}
		];
		expect(calculateNutritionalInfo(products)).toEqual({
			totalCalories: 33,
			totalProtein: 3.3,
			totalFat: 3.3,
			totalCarbs: 3.3
		});
	});
});

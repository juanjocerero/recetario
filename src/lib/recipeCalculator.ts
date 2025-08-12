// Ruta: src/lib/recipeCalculator.ts

// Justificación: Aislar la lógica de cálculo en funciones puras hace que el código
// sea más predecible, fácil de testear y reutilizable. Este módulo no tiene
// dependencias externas (como Prisma o APIs), solo recibe datos y devuelve un resultado.

// Definimos un tipo para los productos que usará la calculadora.
// Esto nos desacopla de los modelos de Prisma.
export type CalculableProduct = {
	quantity: number; // en gramos
	calories?: number | null; // por 100g
	protein?: number | null;
	fat?: number | null;
	carbs?: number | null;
};

export type NutritionalInfo = {
	totalCalories: number;
	totalProtein: number;
	totalFat: number;
	totalCarbs: number;
};

/**
* Calcula la información nutricional total para una lista de productos.
* @param products - Un array de productos con su cantidad y valores nutricionales por 100g.
* @returns Un objeto con los totales de calorías, proteínas, grasas y carbohidratos.
*/
export function calculateNutritionalInfo(products: CalculableProduct[]): NutritionalInfo {
	const totals: NutritionalInfo = {
		totalCalories: 0,
		totalProtein: 0,
		totalFat: 0,
		totalCarbs: 0
	};
	
	for (const product of products) {
		const factor = product.quantity / 100;
		totals.totalCalories += (product.calories || 0) * factor;
		totals.totalProtein += (product.protein || 0) * factor;
		totals.totalFat += (product.fat || 0) * factor;
		totals.totalCarbs += (product.carbs || 0) * factor;
	}
	
	// Redondeamos a 2 decimales para una mejor presentación
	return {
		totalCalories: Math.round(totals.totalCalories * 100) / 100,
		totalProtein: Math.round(totals.totalProtein * 100) / 100,
		totalFat: Math.round(totals.totalFat * 100) / 100,
		totalCarbs: Math.round(totals.totalCarbs * 100) / 100
	};
}

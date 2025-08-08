// src/routes/api/ingredients/details/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ingredientService } from '$lib/server/services/ingredientService';
import type { CalculableIngredient } from '$lib/recipeCalculator';

// Este tipo define la estructura que espera el RecipeForm
type IngredientDetails = CalculableIngredient & {
	name: string;
	imageUrl?: string | null;
};

async function fetchProductFromOFF(
	barcode: string,
	fetchFn: typeof fetch
): Promise<IngredientDetails | null> {
	try {
		const response = await fetchFn(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
		if (!response.ok) return null;

		const data = await response.json();
		if (data.status !== 1 || !data.product) return null;

		const offProduct = data.product;
		const nutriments = offProduct.nutriments;

		// Validar que tenemos los datos mínimos
		if (
			!offProduct.product_name ||
			nutriments?.['energy-kcal_100g'] === undefined ||
			nutriments?.proteins_100g === undefined ||
			nutriments?.fat_100g === undefined ||
			nutriments?.carbohydrates_100g === undefined
		) {
			return null;
		}

		return {
			name: offProduct.product_name,
			imageUrl: offProduct.image_url || null,
			quantity: 100, // Default quantity
			calories: nutriments['energy-kcal_100g'] ?? 0,
			protein: nutriments.proteins_100g ?? 0,
			fat: nutriments.fat_100g ?? 0,
			carbs: nutriments.carbohydrates_100g ?? 0
		};
	} catch (error) {
		console.error(`[OFF Fetch Error] Failed to fetch product ${barcode}:`, error);
		return null;
	}
}

export const GET: RequestHandler = async ({ params, url, fetch }) => {
	const { id } = params;
	const source = url.searchParams.get('source');

	if (!source) {
		return json({ message: 'Missing "source" query parameter' }, { status: 400 });
	}

	try {
		let ingredientDetails: IngredientDetails | null = null;

		if (source === 'local') {
			const products = await ingredientService.getByIds([id]);
			const product = products[0];
			if (product) {
				ingredientDetails = {
					...product,
					quantity: 100 // Default quantity
				};
			}
		} else if (source === 'off') {
			ingredientDetails = await fetchProductFromOFF(id, fetch);
		}

		if (!ingredientDetails) {
			return json({ message: `Ingredient with id ${id} not found` }, { status: 404 });
		}

		return json(ingredientDetails);
	} catch (error) {
		console.error(`Failed to fetch ingredient details for id ${id}:`, error);
		return json(
			{ message: 'An error occurred while fetching ingredient details.' },
			{ status: 500 }
		);
	}
};
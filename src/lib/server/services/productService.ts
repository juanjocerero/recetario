// Ruta: src/lib/server/services/productService.ts
import prisma from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';
import ky from 'ky';
import { normalizeText } from '$lib/utils';

// Definición de tipos para la respuesta de la API de Open Food Facts
type OpenFoodFactsProduct = {
	code: string;
	product_name: string;
	brands?: string;
	image_url?: string;
	nutriments: {
		'energy-kcal_100g'?: number; // Variante con guion
		energy_kcal_100g?: number; // Variante con guion bajo
		fat_100g?: number;
		proteins_100g?: number;
		carbohydrates_100g?: number;
	};
};

type OpenFoodFactsResponse = {
	status: number;
	product?: OpenFoodFactsProduct;
};

// Justificación: La capa de servicio abstrae la lógica de negocio y el acceso a datos.
// Para este servicio, se coordinará la consulta a la caché local (Prisma) y
// la llamada a la API externa (Open Food Facts) si es necesario.

export const productService = {
	/**
	 * Busca un producto por su código de barras.
	 * Primero intenta encontrarlo en la caché local (tabla Product).
	 * Si no lo encuentra, lo busca en la API de Open Food Facts,
	 * lo guarda en la caché y luego lo devuelve.
	 * @param barcode - El código de barras del producto a buscar.
	 */
	async findByBarcode(barcode: string) {
		const cachedProduct = await prisma.product.findUnique({
			where: { id: barcode }
		});

		if (cachedProduct) {
			console.log(`[Cache] HIT for barcode: ${barcode}`);
			return cachedProduct;
		}

		console.log(`[Cache] MISS for barcode: ${barcode}. Fetching from OFF.`);
		const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;

		try {
			const response = await ky.get(url).json<OpenFoodFactsResponse>();

			if (response.status === 0 || !response.product) {
				return null; // Producto no encontrado en OFF
			}

			const productFromApi = response.product;

			// Helper para parsear valores que pueden ser string o number
			const parseNutriment = (value: unknown): number => {
				if (typeof value === 'number') return value;
				if (typeof value === 'string') {
					const parsed = parseFloat(value);
					return isNaN(parsed) ? 0 : parsed;
				}
				return 0;
			};

			const calories =
				productFromApi.nutriments['energy-kcal_100g'] ??
				productFromApi.nutriments.energy_kcal_100g;

			// 1. Normalizar datos de la API a nuestro esquema
			const normalizedProduct = {
				id: productFromApi.code,
				name: productFromApi.product_name,
				// Justificación: Se genera el nombre normalizado para la búsqueda.
				normalizedName: normalizeText(productFromApi.product_name),
				brand: productFromApi.brands,
				imageUrl: productFromApi.image_url,
				calories: parseNutriment(calories),
				fat: parseNutriment(productFromApi.nutriments.fat_100g),
				protein: parseNutriment(productFromApi.nutriments.proteins_100g),
				carbs: parseNutriment(productFromApi.nutriments.carbohydrates_100g),
				// Justificación (Prisma.InputJsonValue): Hacemos un type casting a `InputJsonValue`
				// para asegurar a TypeScript que la estructura del objeto de la API
				// es compatible con el tipo `Json` que Prisma espera.
				fullPayload: productFromApi as Prisma.InputJsonValue
			};

			// 2. Guardar en caché para futuras peticiones
			console.log(`[Cache] WRITING product: ${normalizedProduct.name}`);
			const newCachedProduct = await prisma.product.create({
				data: normalizedProduct
			});

			// 3. Devolver el producto recién cacheado
			return newCachedProduct;
		} catch (error) {
			console.error(`[OFF] Error fetching product ${barcode}:`, error);
			return null;
		}
	},

	/**
	 * Elimina un producto de la caché por su ID (código de barras).
	 * @param barcode - El ID del producto a eliminar.
	 */
	async deleteById(barcode: string) {
		return await prisma.product.delete({
			where: { id: barcode }
		});
	}
};

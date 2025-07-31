// Ruta: src/lib/server/services/productService.ts
import prisma from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';
import ky from 'ky';

// Definición de tipos para la respuesta de la API de Open Food Facts
type OpenFoodFactsProduct = {
	code: string;
	product_name: string;
	brands?: string;
	image_url?: string;
	nutrients: {
		energy_kcal_100g?: number;
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
	 * Primero intenta encontrarlo en la caché local (ProductCache).
	 * Si no lo encuentra, lo busca en la API de Open Food Facts,
	 * lo guarda en la caché y luego lo devuelve.
	 * @param barcode - El código de barras del producto a buscar.
	 */
	async findByBarcode(barcode: string) {
		const cachedProduct = await prisma.productCache.findUnique({
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

			// 1. Normalizar datos de la API a nuestro esquema
			const normalizedProduct = {
				id: productFromApi.code,
				productName: productFromApi.product_name,
				brand: productFromApi.brands,
				imageUrl: productFromApi.image_url,
				calories: productFromApi.nutrients.energy_kcal_100g,
				fat: productFromApi.nutrients.fat_100g,
				protein: productFromApi.nutrients.proteins_100g,
				carbs: productFromApi.nutrients.carbohydrates_100g,
				// Justificación (Prisma.InputJsonValue): Hacemos un type casting a `InputJsonValue`
				// para asegurar a TypeScript que la estructura del objeto de la API
				// es compatible con el tipo `Json` que Prisma espera.
				fullPayload: productFromApi as Prisma.InputJsonValue
			};

			// 2. Guardar en caché para futuras peticiones
			console.log(`[Cache] WRITING product: ${normalizedProduct.productName}`);
			const newCachedProduct = await prisma.productCache.create({
				data: normalizedProduct
			});

			// 3. Devolver el producto recién cacheado
			return newCachedProduct;
		} catch (error) {
			console.error(`[OFF] Error fetching product ${barcode}:`, error);
			return null;
		}
	}
};

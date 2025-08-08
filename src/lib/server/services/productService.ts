// Ruta: src/lib/server/services/productService.ts
import prisma from '$lib/server/prisma';
import { type Product } from '$lib/schemas/productSchema';
import { normalizeText } from '$lib/utils';
import ky from 'ky';

// --- Tipos de la API de OpenFoodFacts ---
type OpenFoodFactsProduct = {
	code: string;
	product_name: string;
	image_url?: string;
	nutriments: {
		'energy-kcal_100g'?: number;
		fat_100g?: number;
		proteins_100g?: number;
		carbohydrates_100g?: number;
	};
};

type OpenFoodFactsResponse = {
	status: number;
	product?: OpenFoodFactsProduct;
};

export const productService = {
	/**
	 * Busca productos por nombre en la base de datos.
	 */
	async searchByName(query: string) {
		const normalizedQuery = normalizeText(query);
		return prisma.product.findMany({
			where: {
				normalizedName: {
					contains: normalizedQuery
				}
			}
		});
	},

	/**
	 * Obtiene todos los productos, con opción de búsqueda y ordenación.
	 */
	async getAll(search?: string, sort: string = 'name', order: string = 'asc') {
		const whereClause = search
			? {
					normalizedName: {
						contains: normalizeText(search)
					}
			  }
			: {};

		const orderByClause = { [sort]: order };

		return prisma.product.findMany({
			where: whereClause,
			orderBy: orderByClause
		});
	},

	/**
	 * Crea un nuevo producto.
	 */
	async create(data: Product, barcode?: string) {
		const normalizedName = normalizeText(data.name);
		return prisma.product.create({
			data: {
				...data,
				normalizedName,
				barcode
			}
		});
	},

	/**
	 * Actualiza un producto existente.
	 */
	async update(id: string, data: Product) {
		const normalizedName = normalizeText(data.name);
		return prisma.product.update({
			where: { id },
			data: {
				...data,
				normalizedName
			}
		});
	},

	/**
	 * Elimina un producto.
	 */
	async delete(id: string) {
		return prisma.product.delete({
			where: { id }
		});
	},

	/**
	 * Obtiene los detalles completos de una lista de productos por sus IDs.
	 */
	async getByIds(ids: string[]) {
		if (ids.length === 0) {
			return [];
		}
		return prisma.product.findMany({
			where: { id: { in: ids } }
		});
	},

	/**
	 * Busca un producto por su código de barras.
	 * Primero intenta encontrarlo en la base de datos local.
	 * Si no lo encuentra, lo busca en la API de Open Food Facts,
	 * lo guarda en la base de datos y luego lo devuelve.
	 */
	async findByBarcode(barcode: string) {
		const cachedProduct = await prisma.product.findUnique({
			where: { barcode }
		});

		if (cachedProduct) {
			return cachedProduct;
		}

		const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;

		try {
			const response = await ky.get(url).json<OpenFoodFactsResponse>();

			if (response.status === 0 || !response.product) {
				return null;
			}

			const productFromApi = response.product;
			const productName = productFromApi.product_name;

			const parseNutriment = (value: unknown): number => {
				if (typeof value === 'number') return value;
				if (typeof value === 'string') {
					const parsed = parseFloat(value);
					return isNaN(parsed) ? 0 : parsed;
				}
				return 0;
			};

			const newProduct = await prisma.product.create({
				data: {
					name: productName,
					normalizedName: normalizeText(productName),
					barcode: productFromApi.code,
					imageUrl: productFromApi.image_url,
					calories: parseNutriment(productFromApi.nutriments['energy-kcal_100g']),
					fat: parseNutriment(productFromApi.nutriments.fat_100g),
					protein: parseNutriment(productFromApi.nutriments.proteins_100g),
					carbs: parseNutriment(productFromApi.nutriments.carbohydrates_100g)
				}
			});

			return newProduct;
		} catch (error) {
			console.error(`[OFF] Error fetching product ${barcode}:`, error);
			return null;
		}
	}
};

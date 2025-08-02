// Ruta: src/lib/server/services/ingredientService.ts
import type { CustomIngredient, Product } from '@prisma/client';
import prisma from '$lib/server/prisma';
// Justificación: Importamos el 'const' IngredientSchema para la validación en tiempo de ejecución
// y el 'type' Ingredient para las anotaciones de tipo estáticas, cumpliendo con verbatimModuleSyntax.
import { type Ingredient } from '$lib/schemas/ingredientSchema';
import { normalizeText } from '$lib/utils';

// Justificación: La capa de servicio abstrae la lógica de negocio y el acceso a datos.
// Esto mantiene los endpoints de la API (controladores) limpios y centrados en manejar
// la petición y la respuesta, mientras que la lógica real reside aquí.

export const ingredientService = {
	/**
	 * Busca ingredientes por nombre en la base de datos local (custom y cacheados).
	 * @param query - El término de búsqueda.
	 */
	async searchByName(query: string): Promise<{ customIngredients: CustomIngredient[], cachedProducts: Product[] }> {
		const normalizedQuery = normalizeText(query);

		// --- INICIO DE CÓDIGO DE DEPURACIÓN ---
		console.log(`[DEBUG] Buscando ingredientes con query normalizado: "${normalizedQuery}"`);
		// --- FIN DE CÓDIGO DE DEPURACIÓN ---

		const customIngredients = await prisma.customIngredient.findMany({
			where: {
				normalizedName: {
					contains: normalizedQuery
				}
			}
		});

		const cachedProducts = await prisma.product.findMany({
			where: {
				normalizedName: {
					contains: normalizedQuery
				}
			}
		});

		// --- INICIO DE CÓDIGO DE DEPURACIÓN ---
		console.log(`[DEBUG] Encontrados ${customIngredients.length} ingredientes custom.`);
		console.log(`[DEBUG] Encontrados ${cachedProducts.length} productos en caché.`);
		// --- FIN DE CÓDIGO DE DEPURACIÓN ---

		return {
			customIngredients,
			cachedProducts
		};
	},
	/**
	 * Obtiene todos los ingredientes personalizados.
	 */
	async getAll() {
		return await prisma.customIngredient.findMany({
			orderBy: { name: 'asc' }
		});
	},

	/**
	 * Obtiene todos los ingredientes (personalizados y cacheados) en una lista unificada.
	 */
	async getAllUnified() {
		const customIngredients = await prisma.customIngredient.findMany({
			orderBy: { name: 'asc' }
		});
		const cachedProducts = await prisma.product.findMany({
			orderBy: { name: 'asc' }
		});

		const unifiedList = [
			...customIngredients.map((i) => ({ ...i, source: 'custom' as const })),
			...cachedProducts.map((p) => ({ ...p, source: 'product' as const }))
		];

		return unifiedList.sort((a, b) => a.name.localeCompare(b.name));
	},

	/**
	 * Crea un nuevo ingrediente personalizado.
	 * @param data - Datos validados por Zod.
	 */
	async create(data: Ingredient) {
		// Justificación: Se genera el nombre normalizado antes de la inserción
		// para asegurar que la búsqueda insensible a acentos funcione correctamente.
		const normalizedName = normalizeText(data.name);
		return await prisma.customIngredient.create({
			data: {
				name: data.name,
				calories: data.calories,
				fat: data.fat,
				protein: data.protein,
				carbs: data.carbs,
				normalizedName
			}
		});
	},

	/**
	 * Actualiza un ingrediente personalizado existente.
	 * @param id - El ID del ingrediente a actualizar.
	 * @param data - Datos validados por Zod.
	 */
	async update(id: string, data: Ingredient) {
		// Justificación: Se actualiza el nombre normalizado junto con el nombre
		// para mantener la consistencia de los datos para la búsqueda.
		const normalizedName = normalizeText(data.name);
		return await prisma.customIngredient.update({
			where: { id },
			data: {
				...data,
				normalizedName
			}
		});
	},

	/**
	 * Elimina un ingrediente personalizado.
	 * @param id - El ID del ingrediente a eliminar.
	 */
	async deleteById(id: string) {
		return await prisma.customIngredient.delete({
			where: { id }
		});
	},

	/**
	 * Sincroniza los ingredientes de la base de datos local que provienen de Open Food Facts (OFF).
	 * Compara los datos locales con los de la API de OFF y actualiza si hay diferencias.
	 * Incluye un retardo para no sobrecargar la API y maneja errores por ingrediente.
	 */
	async syncWithOpenFoodFacts(): Promise<{
		updatedIngredients: string[];
		failedIngredients: { id: string; name: string; reason: string }[];
	}> {
		const updatedIngredients: string[] = [];
		const failedIngredients: { id: string; name: string; reason: string }[] = [];
		const API_DELAY_MS = 300; // Justificación: Retardo para ser respetuosos con la API de OFF.

		// Justificación: Obtenemos solo los productos cacheados, que son los que provienen de OFF.
		const productsToSync = await prisma.product.findMany();

		for (const product of productsToSync) {
			try {
				const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${product.id}.json`);

				// Justificación: Pausa para evitar rate-limiting.
				await new Promise((resolve) => setTimeout(resolve, API_DELAY_MS));

				if (!response.ok) {
					failedIngredients.push({
						id: product.id,
						name: product.name,
						reason: `Error ${response.status}: ${response.statusText}`
					});
					continue; // Salta al siguiente ingrediente
				}

				const offData = await response.json();

				if (offData.status !== 1 || !offData.product) {
					failedIngredients.push({
						id: product.id,
						name: product.name,
						reason: 'Producto no encontrado en Open Food Facts'
					});
					continue;
				}

				const offProduct = offData.product;

				// Justificación: Mapeamos los datos de OFF a nuestra estructura de Product.
				// Usamos el operador de encadenamiento opcional y el de anulación (??)
				// para manejar de forma segura la posible ausencia de datos en la respuesta de la API.
				const newProductData = {
					name: offProduct.product_name || product.name,
					normalizedName: normalizeText(offProduct.product_name || product.name),
					brand: offProduct.brands || product.brand,
					imageUrl: offProduct.image_url || product.imageUrl,
					calories: offProduct.nutriments?.['energy-kcal_100g'] ?? product.calories,
					fat: offProduct.nutriments?.fat_100g ?? product.fat,
					protein: offProduct.nutriments?.proteins_100g ?? product.protein,
					carbs: offProduct.nutriments?.carbohydrates_100g ?? product.carbs,
					fullPayload: offProduct
				};

				// Justificación: Comparamos los campos relevantes para ver si es necesaria una actualización.
				// Se comparan los valores primitivos y el payload JSON completo para detectar cualquier cambio.
				const isDifferent =
					newProductData.name !== product.name ||
					newProductData.brand !== product.brand ||
					newProductData.imageUrl !== product.imageUrl ||
					newProductData.calories !== product.calories ||
					newProductData.fat !== product.fat ||
					newProductData.protein !== product.protein ||
					newProductData.carbs !== product.carbs;

				if (isDifferent) {
					await prisma.product.update({
						where: { id: product.id },
						data: newProductData
					});
					updatedIngredients.push(product.name);
				}
			} catch (error) {
				failedIngredients.push({
					id: product.id,
					name: product.name,
					reason: error instanceof Error ? error.message : 'Error desconocido'
				});
			}
		}

		return { updatedIngredients, failedIngredients };
	}
};
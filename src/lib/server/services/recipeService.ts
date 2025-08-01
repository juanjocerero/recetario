// Ruta: src/lib/server/services/recipeService.ts
import prisma from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';
import type { RecipeData } from '$lib/schemas/recipeSchema';

import { productService } from './productService';
import { imageService } from './imageService';

// Justificación: La capa de servicio para recetas abstrae toda la lógica de negocio
// y el acceso a la base de datos (Prisma) para las operaciones CRUD.
// Esto mantiene los endpoints de la API limpios y centrados en su rol de controlador.

const recipeInclude = {
	ingredients: {
		include: {
			product: true,
			customIngredient: true
		}
	},
	urls: true
};

/**
 * Función auxiliar para asegurar que todos los productos de una receta
 * están cacheados en nuestra base de datos antes de la operación principal.
 * @param ingredients - La lista de ingredientes de la receta.
 */
async function ensureProductsAreCached(ingredients: RecipeData['ingredients']) {
	const productCachePromises = ingredients
		.filter((ing) => ing.type === 'product')
		.map((ing) => productService.findByBarcode(ing.id));

	await Promise.all(productCachePromises);
}

export const recipeService = {
	/**
	 * Obtiene todas las recetas con sus ingredientes y URLs.
	 */
	async getAll() {
		return await prisma.recipe.findMany({
			include: recipeInclude,
			orderBy: { title: 'asc' }
		});
	},

	/**
	 * Obtiene una receta por su ID, incluyendo todos sus ingredientes y URLs.
	 * @param id - El ID de la receta.
	 */
	async getById(id: string) {
		return await prisma.recipe.findUnique({
			where: { id },
			include: recipeInclude
		});
	},

	/**
	 * Crea una nueva receta y sus ingredientes asociados en una transacción.
	 * @param data - Datos de la receta validados por Zod.
	 */
	async create(data: RecipeData) {
		const { title, description, steps, ingredients, urls, imageUrl: directImageUrl } = data;

		await ensureProductsAreCached(ingredients);

		// Corrección: Se declara explícitamente el tipo para aceptar string, null y undefined.
		let finalImageUrl: string | null | undefined = directImageUrl;
		if (!finalImageUrl && urls && urls.length > 0) {
			finalImageUrl = await imageService.getImageFromUrl(urls[0]);
		}

		return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			const newRecipe = await tx.recipe.create({
				data: {
					title,
					description,
					steps,
					imageUrl: finalImageUrl,
					urls: {
						create: urls?.map((url: string) => ({ url }))
					}
				}
			});

			for (const ingredient of ingredients) {
				await tx.recipeIngredient.create({
					data: {
						recipeId: newRecipe.id,
						quantity: ingredient.quantity,
						productId: ingredient.type === 'product' ? ingredient.id : null,
						customIngredientId: ingredient.type === 'custom' ? ingredient.id : null
					}
				});
			}

			return await tx.recipe.findUnique({
				where: { id: newRecipe.id },
				include: recipeInclude
			});
		});
	},

	/**
	 * Actualiza una receta existente y sus ingredientes en una transacción.
	 * @param id - El ID de la receta a actualizar.
	 * @param data - Datos de la receta validados por Zod.
	 */
	async update(id: string, data: RecipeData) {
		const { title, description, steps, ingredients, urls, imageUrl: directImageUrl } = data;

		await ensureProductsAreCached(ingredients);

		// Corrección: Se declara explícitamente el tipo para aceptar string, null y undefined.
		let finalImageUrl: string | null | undefined = directImageUrl;
		if (!finalImageUrl && urls && urls.length > 0) {
			finalImageUrl = await imageService.getImageFromUrl(urls[0]);
		}

		return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
			await tx.recipe.update({
				where: { id },
				data: {
					title,
					description,
					steps,
					imageUrl: finalImageUrl
				}
			});

			await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
			for (const ingredient of ingredients) {
				await tx.recipeIngredient.create({
					data: {
						recipeId: id,
						quantity: ingredient.quantity,
						productId: ingredient.type === 'product' ? ingredient.id : null,
						customIngredientId: ingredient.type === 'custom' ? ingredient.id : null
					}
				});
			}

			await tx.recipeUrl.deleteMany({ where: { recipeId: id } });
			if (urls && urls.length > 0) {
				await tx.recipeUrl.createMany({
					data: urls.map((url: string) => ({ recipeId: id, url }))
				});
			}

			return await tx.recipe.findUnique({
				where: { id },
				include: recipeInclude
			});
		});
	},

	/**
	 * Elimina una receta. La cascada se encarga de los ingredientes y URLs.
	 * @param id - El ID de la receta a eliminar.
	 */
	async deleteById(id: string) {
		return await prisma.recipe.delete({
			where: { id }
		});
	}
};
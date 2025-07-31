// Ruta: src/lib/server/services/recipeService.ts
import prisma from '$lib/server/prisma';
import type { RecipeData } from '$lib/schemas/recipeSchema';

// Justificación: La capa de servicio para recetas abstrae toda la lógica de negocio
// y el acceso a la base de datos (Prisma) para las operaciones CRUD.
// Esto mantiene los endpoints de la API limpios y centrados en su rol de controlador.

const recipeInclude = {
	ingredients: {
		include: {
			productCache: true,
			customIngredient: true
		}
	}
};

export const recipeService = {
	/**
	 * Obtiene todas las recetas con sus ingredientes.
	 */
	async getAll() {
		return await prisma.recipe.findMany({
			include: recipeInclude,
			orderBy: { title: 'asc' }
		});
	},

	/**
	 * Obtiene una receta por su ID, incluyendo todos sus ingredientes.
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
		const { title, description, steps, ingredients } = data;

		// Justificación (transacción): Se usa $transaction para asegurar la atomicidad.
		// O se crea la receta Y todos sus ingredientes, o no se crea nada.
		// Esto previene que queden datos huérfanos si una de las operaciones falla.
		return await prisma.$transaction(async (tx) => {
			const newRecipe = await tx.recipe.create({
				data: { title, description, steps }
			});

			for (const ingredient of ingredients) {
				await tx.recipeIngredient.create({
					data: {
						recipeId: newRecipe.id,
						quantity: ingredient.quantity,
						productCacheId: ingredient.type === 'product' ? ingredient.id : null,
						customIngredientId: ingredient.type === 'custom' ? ingredient.id : null
					}
				});
			}

			// Devolvemos la receta completa con sus ingredientes recién creados.
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
		const { title, description, steps, ingredients } = data;

		return await prisma.$transaction(async (tx) => {
			// 1. Actualizar los datos básicos de la receta.
			await tx.recipe.update({
				where: { id },
				data: { title, description, steps }
			});

			// 2. Eliminar todos los ingredientes antiguos. Es la forma más simple y robusta
			// de manejar actualizaciones, eliminaciones y adiciones de ingredientes.
			await tx.recipeIngredient.deleteMany({
				where: { recipeId: id }
			});

			// 3. Crear los nuevos ingredientes asociados a la receta.
			for (const ingredient of ingredients) {
				await tx.recipeIngredient.create({
					data: {
						recipeId: id,
						quantity: ingredient.quantity,
						productCacheId: ingredient.type === 'product' ? ingredient.id : null,
						customIngredientId: ingredient.type === 'custom' ? ingredient.id : null
					}
				});
			}

			// Devolvemos la receta actualizada completa.
			return await tx.recipe.findUnique({
				where: { id },
				include: recipeInclude
			});
		});
	},

	/**
	 * Elimina una receta. La cascada se encarga de los ingredientes.
	 * @param id - El ID de la receta a eliminar.
	 */
	async deleteById(id: string) {
		return await prisma.recipe.delete({
			where: { id }
		});
	}
};

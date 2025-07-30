// Ruta: src/lib/server/services/ingredientService.ts
import prisma from '$lib/server/prisma';
// Justificación: Importamos el 'const' IngredientSchema para la validación en tiempo de ejecución
// y el 'type' Ingredient para las anotaciones de tipo estáticas, cumpliendo con verbatimModuleSyntax.
import { IngredientSchema, type Ingredient } from '$lib/schemas/ingredientSchema';

// Justificación: La capa de servicio abstrae la lógica de negocio y el acceso a datos.
// Esto mantiene los endpoints de la API (controladores) limpios y centrados en manejar
// la petición y la respuesta, mientras que la lógica real reside aquí.

export const ingredientService = {
	/**
	 * Obtiene todos los ingredientes personalizados.
	 */
	async getAll() {
		return await prisma.customIngredient.findMany({
			orderBy: { name: 'asc' }
		});
	},

	/**
	 * Crea un nuevo ingrediente personalizado.
	 * @param data - Datos validados por Zod.
	 */
	async create(data: Ingredient) {
		// Validamos los datos con el esquema antes de la operación de base de datos.
		IngredientSchema.parse(data);
		return await prisma.customIngredient.create({
			data
		});
	},

	/**
	 * Actualiza un ingrediente personalizado existente.
	 * @param id - El ID del ingrediente a actualizar.
	 * @param data - Datos validados por Zod.
	 */
	async update(id: string, data: Ingredient) {
		// Validamos los datos con el esquema antes de la operación de base de datos.
		IngredientSchema.parse(data);
		return await prisma.customIngredient.update({
			where: { id },
			data
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
	}
};
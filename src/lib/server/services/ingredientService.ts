// Ruta: src/lib/server/services/ingredientService.ts
import prisma from '$lib/server/prisma';
// Justificación: Importamos el 'const' IngredientSchema para la validación en tiempo de ejecución
// y el 'type' Ingredient para las anotaciones de tipo estáticas, cumpliendo con verbatimModuleSyntax.
import { IngredientSchema, type Ingredient } from '$lib/schemas/ingredientSchema';
import { normalizeText } from '$lib/utils';

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
		// Justificación: Se genera el nombre normalizado antes de la inserción
		// para asegurar que la búsqueda insensible a acentos funcione correctamente.
		const normalizedName = normalizeText(data.name);
		return await prisma.customIngredient.create({
			data: {
				...data,
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
	}
};
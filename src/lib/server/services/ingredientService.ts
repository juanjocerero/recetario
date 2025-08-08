// Ruta: src/lib/server/services/ingredientService.ts
import prisma from '$lib/server/prisma';
import { type Ingredient } from '$lib/schemas/ingredientSchema';
import { normalizeText } from '$lib/utils';

// Justificación: La capa de servicio abstrae la lógica de negocio y el acceso a datos.
// Se ha simplificado para operar únicamente sobre el modelo `Product` unificado.

export const ingredientService = {
	/**
	 * Busca productos por nombre en la base de datos.
	 * @param query - El término de búsqueda.
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
	 * @param data - Datos validados por Zod.
	 * @param barcode - (Opcional) Código de barras si proviene de OFF.
	 */
	async create(data: Ingredient, barcode?: string) {
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
	 * @param id - El ID del producto a actualizar.
	 * @param data - Datos validados por Zod.
	 */
	async update(id: string, data: Ingredient) {
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
	 * @param id - El ID del producto a eliminar.
	 */
	async delete(id: string) {
		return prisma.product.delete({
			where: { id }
		});
	},

	/**
	 * Obtiene los detalles completos de una lista de productos por sus IDs.
	 * @param ids - Un array de IDs de productos.
	 */
	async getByIds(ids: string[]) {
		if (ids.length === 0) {
			return [];
		}
		return prisma.product.findMany({
			where: { id: { in: ids } }
		});
	}
};

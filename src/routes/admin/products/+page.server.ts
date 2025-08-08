import { productService } from '$lib/server/services/productService';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { ProductSchema } from '$lib/schemas/productSchema';
import { createFailResponse } from '$lib/server/zodErrors';
import { Prisma } from '@prisma/client';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') ?? '';
	const sort = url.searchParams.get('sort') ?? 'name';
	const order = url.searchParams.get('order') ?? 'asc';

	try {
		// Ahora solo hay un tipo de producto: Product. El servicio se ha simplificado.
		const products = await productService.getAll(search, sort, order);
		return {
			products,
			search,
			sort,
			order
		};
	} catch (error) {
		console.error('Error al cargar los productos:', error);
		return {
			products: [],
			search,
			sort,
			order,
			error: 'No se pudieron cargar los productos'
		};
	}
};

export const actions: Actions = {
	// Esta acción ahora crea un Product.
	addCustom: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
		const validation = ProductSchema.safeParse(formData);

		if (!validation.success) {
			return fail(400, {
				data: formData,
				...createFailResponse('La validación falló', validation.error)
			});
		}

		try {
			await productService.create(validation.data);
			return { success: true, message: 'Producto añadido con éxito' };
		} catch (error) {
			console.error('Error al crear el producto:', error);
			return fail(500, {
				data: formData,
				message: 'No se pudo crear el producto.'
			});
		}
	},

	// La acción de actualizar ahora opera sobre el modelo Product.
	update: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
		const id = formData.id as string;
		const validation = ProductSchema.safeParse(formData);

		if (!validation.success) {
			return fail(400, {
				data: formData,
				...createFailResponse('La validación falló', validation.error)
			});
		}

		try {
			await productService.update(id, validation.data);
			return { success: true, message: 'Producto actualizado con éxito' };
		} catch (error) {
			console.error(`Error al actualizar el producto ${id}:`, error);
			return fail(500, {
				data: formData,
				message: 'No se pudo actualizar el producto.'
			});
		}
	},

	// La acción de eliminar ahora opera sobre el modelo Product.
	delete: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
		const id = formData.id as string;

		if (!id) {
			return fail(400, { message: 'ID de producto no proporcionado.' });
		}

		try {
			await productService.delete(id);
			return { success: true, message: 'Producto eliminado con éxito' };
		} catch (error) {
			console.error(`Error al eliminar el producto ${id}:`, error);
			// Prisma lanza un error específico si la restricción de clave externa falla
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
				return fail(409, {
					message: 'No se puede eliminar el producto porque está siendo usado en una o más recetas.'
				});
			}
			return fail(500, {
				message: 'No se pudo eliminar el producto.'
			});
		}
	}
};

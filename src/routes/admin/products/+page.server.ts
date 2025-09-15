import { productService } from '$lib/server/services/productService';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { ProductSchema } from '$lib/schemas/productSchema';
import { createFailResponse } from '$lib/server/zodErrors';
import { Prisma } from '@prisma/client';
import { imageService } from '$lib/server/services/imageService';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') ?? '';
	const sort = url.searchParams.get('sort') ?? 'normalizedName';
	const order = url.searchParams.get('order') ?? 'asc';
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const pageSize = 50;

	try {
		const { products, total } = await productService.getAll(search, sort, order, page, pageSize);
		const totalPages = Math.ceil(total / pageSize);

		return {
			products,
			search,
			sort,
			order,
			page,
			totalPages
		};
	} catch (error) {
		console.error('Error al cargar los productos:', error);
		return {
			products: [],
			search,
			sort,
			order,
			page,
			totalPages: 0,
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
			return { success: true, message: 'Producto añadido con éxito.' };
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
		// Usamos .partial() para permitir la actualización de solo algunos campos
		const validation = ProductSchema.partial().safeParse(formData);
		
		if (!validation.success) {
			return fail(400, {
				data: formData,
				...createFailResponse('La validación falló', validation.error)
			});
		}
		
		try {
			await productService.update(id, validation.data);
			return { success: true, message: 'Producto actualizado con éxito.' };
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
	},
	
	updateImage: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const imageUrl = formData.get('imageUrl') as string;
		
		if (!id) {
			return fail(400, { message: 'ID de producto no proporcionado.' });
		}
		
		const dataToUpdate = { imageUrl: imageUrl || null };
		
		// Validamos solo el campo que estamos actualizando.
		const validation = ProductSchema.partial().safeParse(dataToUpdate);
		if (!validation.success) {
			return fail(400, {
				...createFailResponse('La validación falló', validation.error)
			});
		}
		
		try {
			let finalImageUrl = validation.data.imageUrl ?? null;
			
			// Si la imagen existe y NO es un webp en base64, la procesamos.
			if (finalImageUrl && !finalImageUrl.startsWith('data:image/webp;base64,')) {
				const processedImage = await imageService.process(finalImageUrl);
				if (!processedImage) {
					return fail(400, { message: 'La imagen proporcionada no pudo ser procesada.' });
				}
				finalImageUrl = processedImage;
			}
			
			await productService.update(id, { imageUrl: finalImageUrl });
			
			return { success: true, message: 'Imagen actualizada con éxito.' };
		} catch (error) {
			console.error(`Error al actualizar la imagen del producto ${id}:`, error);
			return fail(500, { message: 'No se pudo actualizar la imagen.' });
		}
	}
};

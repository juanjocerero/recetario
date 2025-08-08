// Ruta: src/routes/api/ingredients/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { productService } from '$lib/server/services/productService';
import { ProductSchema } from '$lib/schemas/productSchema';
import { ZodError } from 'zod';
import { createFailResponse } from '$lib/server/zodErrors';
import { Prisma } from '@prisma/client';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const search = url.searchParams.get('search') ?? undefined;
		const sort = url.searchParams.get('sort') ?? 'name';
		const order = url.searchParams.get('order') ?? 'asc';

		const products = await productService.getAll(search, sort, order);
		return json(products);
	} catch (error) {
		console.error('Error fetching products:', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const validatedData = ProductSchema.parse(body);
		const newProduct = await productService.create(validatedData);
		return json(newProduct, { status: 201 });
	} catch (error) {
		if (error instanceof ZodError) {
			return json(createFailResponse('La validación falló', error), { status: 400 });
		}
		console.error('Error creating product:', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { id } = await request.json();

		if (!id || typeof id !== 'string') {
			return json(createFailResponse('Falta el campo "id"'), { status: 400 });
		}

		await productService.delete(id);

		return json({ success: true, message: 'Producto eliminado con éxito' }, { status: 200 });
	} catch (error) {
		console.error('Error al eliminar el producto:', error);
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
			return json(
				createFailResponse('No se puede eliminar el producto porque está en uso en una receta.'),
				{ status: 409 }
			);
		}
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

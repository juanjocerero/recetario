// Ruta: src/routes/api/products/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { productService } from '$lib/server/services/productService';
import { ProductSchema } from '$lib/schemas/productSchema';
import { ZodError } from 'zod';
// Justificación: Se importa la nueva utilidad unificada.
import { createFailResponse } from '$lib/server/zodErrors';

export const PUT: RequestHandler = async ({ request, params }) => {
	const { id } = params;
	if (!id) {
		return json(createFailResponse('Id de producto requerido'), { status: 400 });
	}

	try {
		const body = await request.json();
		const validatedData = ProductSchema.parse(body);

		const updatedProduct = await productService.update(id, validatedData);
		return json(updatedProduct);
	} catch (error) {
		if (error instanceof ZodError) {
			return json(createFailResponse('La validación falló', error), { status: 400 });
		}
		console.error(`Error actualizando producto con id ${id}:`, error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;
	if (!id) {
		return json(createFailResponse('Id de producto requerido'), { status: 400 });
	}

	try {
		await productService.delete(id);
		return new Response(null, { status: 204 }); // 204 No Content
	} catch (error) {
		console.error(`Error eliminando producto ${id}:`, error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};
// Ruta: src/routes/api/products/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { productService } from '$lib/server/services/productService';

export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;

	if (!id) {
		return json({ message: 'El ID del producto es requerido.' }, { status: 400 });
	}

	try {
		await productService.deleteById(id);
		return new Response(null, { status: 204 }); // No Content
	} catch (error) {
		console.error(`Error deleting product ${id}:`, error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

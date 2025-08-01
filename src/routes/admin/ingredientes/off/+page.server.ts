import { productService } from '$lib/server/services/productService';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	// Acción para añadir un producto de OFF a nuestra base de datos
	add: async ({ request }) => {
		const data = await request.formData();
		const productId = data.get('productId') as string;
		
		if (!productId) {
			return fail(400, { success: false, error: 'Product ID no proporcionado' });
		}
		
		try {
			const product = await productService.findByBarcode(productId);
			
			if (!product) {
				return fail(404, {
					success: false,
					error: `Producto con ID ${productId} no encontrado en Open Food Facts.`
				});
			}
			
			return { success: true, product };
		} catch (error) {
			console.error(error);
			return fail(500, {
				success: false,
				error: 'Error interno del servidor al intentar cachear el producto.'
			});
		}
	}
};

// Ruta: src/routes/api/products/search/[barcode]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { productService } from '$lib/server/services/productService';

// Justificación: Expone el `productService` a través de una API RESTful.
// El endpoint recibe el código de barras como un parámetro de la ruta (`params.barcode`),
// lo que es una práctica estándar para identificar un recurso específico.
// Se importa `RequestHandler` desde `./$types` para obtener el tipado correcto de `params`.
export const GET: RequestHandler = async ({ params }) => {
	const { barcode } = params;
	
	if (!barcode) {
		return json({ message: 'El código de barras es requerido' }, { status: 400 });
	}
	
	try {
		const product = await productService.findByBarcode(barcode);
		
		if (!product) {
			// Si el producto no se encuentra ni en la caché ni en la API de OFF,
			// devolvemos un 404 Not Found, que es el código de estado HTTP correcto.
			return json({ message: 'Producto no encontrado' }, { status: 404 });
		}
		
		// Devolvemos el producto encontrado (ya sea de la caché o de la API).
		return json(product);
	} catch (error) {
		console.error(`Error searching for barcode ${barcode}:`, error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

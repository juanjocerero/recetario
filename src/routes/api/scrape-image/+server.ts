// Ruta: src/routes/api/scrape-image/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { imageService } from '$lib/server/services/imageService';

// Justificación (Paso 1): Creamos un endpoint POST dedicado para el scraping de imágenes.
// Esto permite al frontend solicitar la extracción de una imagen de forma asíncrona
// sin exponer directamente la lógica del servidor.
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { url } = await request.json();

		// Justificación: Validamos que la URL sea una URL HTTP/HTTPS válida
		// antes de procesarla para evitar errores y posibles abusos.
		if (!url || !url.startsWith('http')) {
			throw error(400, 'URL no válida');
		}

		const imageUrl = await imageService.getImageFromUrl(url);

		if (!imageUrl) {
			// Si no se encuentra imagen, devolvemos un 404 específico.
			throw error(404, 'No se pudo encontrar una imagen en la URL proporcionada');
		}

		return json({ imageUrl });
	} catch (e) {
		// Manejo de errores centralizado. Si es un error de SvelteKit (o un objeto con forma de error), lo relanzamos.
		// Si no, devolvemos un error 500 genérico.
		if (typeof e === 'object' && e !== null && 'status' in e) {
			throw e;
		}
		console.error('Error scraping image:', e);
		throw error(500, 'Error interno al procesar la imagen');
	}
};

// src/routes/api/images/compress/+server.ts
import { json, error, type RequestHandler } from '@sveltejs/kit';
import { imageService } from '$lib/server/services/imageService';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('image') as File | null;

		if (!file) {
			throw error(400, 'No se ha proporcionado ninguna imagen.');
		}

		const imageBuffer = Buffer.from(await file.arrayBuffer());

		const compressedImage = await imageService.process(imageBuffer);

		if (!compressedImage) {
			throw error(500, 'No se pudo procesar la imagen.');
		}

		return json({ imageUrl: compressedImage });
	} catch (err) {
		console.error('Error en el endpoint de compresión:', err);
		// Si el error ya es una respuesta de SvelteKit, relánzalo.
		if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
			throw err;
		}
		// De lo contrario, crea un error genérico.
		throw error(500, 'Error interno del servidor al procesar la imagen.');
	}
};

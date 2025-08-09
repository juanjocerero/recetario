// Justificación (Paso 2.2):
// Este servicio encapsula la lógica para obtener y procesar imágenes desde URLs.
// Utiliza 'cheerio' para parsear el HTML y 'sharp' para la optimización de imágenes,
// siguiendo las directrices del plan de implementación.

import sharp from 'sharp';
import * as cheerio from 'cheerio';

const MAX_IMAGE_WIDTH = 768; // Ancho máximo para las imágenes de receta

/**
 * Extrae la URL de la imagen principal (thumbnail) de una página web.
 * Busca en las metaetiquetas 'og:image' y 'twitter:image'.
 * @param url La URL de la página web.
 * @returns La URL de la imagen o null si no se encuentra.
 */
async function getImageUrlFromPage(url: string): Promise<string | null> {
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
			}
		});
		if (!response.ok) {
			console.error(`Error fetching page ${url}: ${response.statusText}`);
			return null;
		}

		const html = await response.text();
		const $ = cheerio.load(html);

		// Priorizamos la etiqueta 'og:image' ya que es el estándar más común.
		const ogImage = $('meta[property="og:image"]').attr('content');
		if (ogImage) return ogImage;

		const twitterImage = $('meta[name="twitter:image"]').attr('content');
		if (twitterImage) return twitterImage;

		return null;
	} catch (error) {
		console.error(`Failed to fetch or parse page at ${url}`, error);
		return null;
	}
}

/**
 * Descarga, optimiza y convierte una imagen a formato WebP en Base64.
 * @param imageUrl La URL de la imagen a procesar.
 * @returns La imagen en formato Base64 con el prefijo de datos, o null si falla.
 */
async function processImage(imageSource: string | Buffer): Promise<string | null> {
	try {
		// sharp puede manejar URLs, buffers, y rutas de archivo.
		// Para data URIs, necesitamos extraer el buffer.
		const imageBuffer =
			typeof imageSource === 'string' && imageSource.startsWith('data:')
				? Buffer.from(imageSource.split(',')[1], 'base64')
				: imageSource;

		const optimizedImageBuffer = await sharp(imageBuffer)
			.resize(MAX_IMAGE_WIDTH, null, { withoutEnlargement: true })
			.webp({ quality: 60 })
			.toBuffer();

		const base64Image = optimizedImageBuffer.toString('base64');
		return `data:image/webp;base64,${base64Image}`;
	} catch (error) {
		console.error(`Failed to process image`, error);
		return null;
	}
}

/**
 * Descarga una imagen desde una URL y devuelve su buffer.
 * @param imageUrl La URL de la imagen a descargar.
 * @returns El buffer de la imagen o null si falla.
 */
async function fetchImageAsBuffer(imageUrl: string): Promise<Buffer | null> {
	try {
		const imageResponse = await fetch(imageUrl);
		if (!imageResponse.ok) {
			console.error(`Error fetching image ${imageUrl}: ${imageResponse.statusText}`);
			return null;
		}
		return Buffer.from(await imageResponse.arrayBuffer());
	} catch (error) {
		console.error(`Failed to fetch image buffer from ${imageUrl}`, error);
		return null;
	}
}

export const imageService = {
	/**
	 * Orquesta el proceso completo: obtiene la URL de la imagen de una página
	 * y luego la procesa.
	 * @param pageUrl La URL de la página de referencia de la receta.
	 * @returns La imagen procesada en Base64 o null si cualquier paso falla.
	 */
	getImageFromPageUrl: async (pageUrl: string): Promise<string | null> => {
		const imageUrl = await getImageUrlFromPage(pageUrl);
		if (!imageUrl) {
			return null;
		}
		const imageBuffer = await fetchImageAsBuffer(imageUrl);
		if (!imageBuffer) {
			return null;
		}
		return processImage(imageBuffer);
	},

	/**
	 * Procesa una imagen desde una URL directa, un buffer o una cadena Base64.
	 * @param source La URL de la imagen, el buffer o la cadena Base64.
	 * @returns La imagen optimizada en formato Base64 WebP, o null si falla.
	 */
	process: processImage
};

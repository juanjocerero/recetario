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
async function processImage(imageUrl: string): Promise<string | null> {
	try {
		const imageResponse = await fetch(imageUrl);
		if (!imageResponse.ok) {
			console.error(`Error fetching image ${imageUrl}: ${imageResponse.statusText}`);
			return null;
		}

		const imageBuffer = await imageResponse.arrayBuffer();

		// Justificación (Paso 2.2):
		// Usamos 'sharp' para redimensionar la imagen a un ancho máximo y convertirla a WebP.
		// WebP ofrece una compresión superior con buena calidad, reduciendo el tamaño
		// de almacenamiento en la base de datos y mejorando los tiempos de carga.
		const optimizedImageBuffer = await sharp(Buffer.from(imageBuffer))
			.resize(MAX_IMAGE_WIDTH, null, { withoutEnlargement: true })
			.webp({ quality: 60 })
			.toBuffer();

		const base64Image = optimizedImageBuffer.toString('base64');
		return `data:image/webp;base64,${base64Image}`;
	} catch (error) {
		console.error(`Failed to process image at ${imageUrl}`, error);
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
	getImageFromUrl: async (pageUrl: string): Promise<string | null> => {
		const imageUrl = await getImageUrlFromPage(pageUrl);
		if (!imageUrl) {
			return null;
		}
		return processImage(imageUrl);
	}
};

/**
 * Llama al endpoint del servidor para extraer una imagen de una página web.
 * Esta función actúa como un cliente para el servicio de scraping del backend.
 * @param pageUrl La URL de la página de la que se quiere extraer la imagen.
 * @returns La URL de la imagen procesada (en formato Base64).
 * @throws Lanza un error con un mensaje legible si la API devuelve un error.
 */
export async function scrapeImageFromPage(pageUrl: string): Promise<string> {
	const response = await fetch('/api/scrape-image', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url: pageUrl })
	});

	const body = await response.json();

	if (!response.ok) {
		// La API devuelve un objeto de error con una propiedad 'message'.
		// Lo usamos para dar un feedback claro al usuario.
		throw new Error(body.message || `Error ${response.status}`);
	}

	if (!body.imageUrl) {
		throw new Error('No se encontró una imagen en la URL proporcionada.');
	}

	return body.imageUrl;
}

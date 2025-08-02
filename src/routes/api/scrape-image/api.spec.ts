// Ruta: src/routes/api/scrape-image/api.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './+server';
import { imageService } from '$lib/server/services/imageService';

vi.mock('$lib/server/services/imageService', () => ({
	imageService: {
		getImageFromUrl: vi.fn()
	}
}));

vi.mock('@sveltejs/kit', async (importOriginal) => {
	const original = await importOriginal<typeof import('@sveltejs/kit')>();
	return {
		...original,
		error: vi.fn((status, message) => ({ status, message }))
	};
});

// Justificación: Se crea un alias para el tipo del evento de la API para mejorar
// la legibilidad y mantener la consistencia con otros ficheros de test.
type ApiEvent = Parameters<typeof POST>[0];

describe('POST /api/scrape-image', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.mocked(console.error).mockRestore();
	});

	it('should return a 200 response with the image URL on success', async () => {
		const mockImageUrl = 'data:image/webp;base64,mock-image-data';
		vi.mocked(imageService.getImageFromUrl).mockResolvedValue(mockImageUrl);

		const request = new Request('http://localhost/api/scrape-image', {
			method: 'POST',
			body: JSON.stringify({ url: 'https://example.com' })
		});

		const response = await POST({ request } as unknown as ApiEvent);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({ imageUrl: mockImageUrl });
		expect(imageService.getImageFromUrl).toHaveBeenCalledWith('https://example.com');
	});

	it('should throw a 400 error for an invalid URL', async () => {
		const request = new Request('http://localhost/api/scrape-image', {
			method: 'POST',
			body: JSON.stringify({ url: 'invalid-url' })
		});

		await expect(POST({ request } as unknown as ApiEvent)).rejects.toEqual({
			status: 400,
			message: 'URL no válida'
		});
	});

	it('should throw a 404 error if no image is found', async () => {
		vi.mocked(imageService.getImageFromUrl).mockResolvedValue(null);

		const request = new Request('http://localhost/api/scrape-image', {
			method: 'POST',
			body: JSON.stringify({ url: 'https://example.com/no-image' })
		});

		await expect(POST({ request } as unknown as ApiEvent)).rejects.toEqual({
			status: 404,
			message: 'No se pudo encontrar una imagen en la URL proporcionada'
		});
	});

	it('should throw a 500 error for internal server errors', async () => {
		vi.mocked(imageService.getImageFromUrl).mockRejectedValue(new Error('Internal processing error'));

		const request = new Request('http://localhost/api/scrape-image', {
			method: 'POST',
			body: JSON.stringify({ url: 'https://example.com/error-page' })
		});

		await expect(POST({ request } as unknown as ApiEvent)).rejects.toEqual({
			status: 500,
			message: 'Error interno al procesar la imagen'
		});
	});
});

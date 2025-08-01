// Ruta: src/lib/server/services/imageService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { imageService } from './imageService';
import sharp from 'sharp';
import * as cheerio from 'cheerio';

// Justificación (Paso 4.1): Mockeamos los módulos 'sharp' y 'cheerio' para aislar
// nuestro servicio de dependencias externas y del sistema de archivos.
// Esto nos permite probar la lógica de nuestro código de forma determinista.
vi.mock('sharp', () => {
	const mockSharpInstance = {
		resize: vi.fn().mockReturnThis(),
		webp: vi.fn().mockReturnThis(),
		toBuffer: vi.fn().mockResolvedValue(Buffer.from('optimized-image-buffer'))
	};
	const sharp = vi.fn(() => mockSharpInstance);
	return { default: sharp };
});

vi.mock('cheerio', () => {
	const mockCheerio = {
		load: vi.fn()
	};
	return { ...mockCheerio, default: mockCheerio };
});

// Mockeamos el `fetch` global
global.fetch = vi.fn();

describe('imageService', () => {
	beforeEach(() => {
		// Limpiamos los mocks antes de cada test para evitar interferencias.
		vi.clearAllMocks();
	});

	it('should return a base64 WebP image if og:image is found', async () => {
		// Arrange
		const pageUrl = 'https://example.com';
		const imageUrl = 'https://example.com/image.jpg';
		const mockHtml = `<html><head><meta property="og:image" content="${imageUrl}"></head></html>`;

		// Mock para el fetch de la página HTML
		(fetch as vi.Mock).mockResolvedValueOnce(
			new Response(mockHtml, {
				status: 200,
				headers: { 'Content-Type': 'text/html' }
			})
		);

		// Mock para el fetch de la imagen
		(fetch as vi.Mock).mockResolvedValueOnce(
			new Response(Buffer.from('image-data'), {
				status: 200,
				headers: { 'Content-Type': 'image/jpeg' }
			})
		);

		// Mock para Cheerio
		const mock$ = vi.fn((selector) => {
			if (selector === 'meta[property="og:image"]') {
				return { attr: () => imageUrl };
			}
			return { attr: () => undefined };
		});
		(cheerio.load as vi.Mock).mockReturnValue(mock$);

		// Act
		const result = await imageService.getImageFromUrl(pageUrl);

		// Assert
		expect(result).toBe('data:image/webp;base64,b3B0aW1pemVkLWltYWdlLWJ1ZmZlcg==');
		expect(fetch).toHaveBeenCalledWith(pageUrl, expect.any(Object));
		expect(fetch).toHaveBeenCalledWith(imageUrl);
		expect(sharp).toHaveBeenCalledWith(Buffer.from('image-data'));
	});

	it('should return null if no image meta tag is found', async () => {
		// Arrange
		const pageUrl = 'https://example.com/no-image';
		const mockHtml = '<html><head></head></html>';

		(fetch as vi.Mock).mockResolvedValueOnce(new Response(mockHtml));
		const mock$ = vi.fn(() => ({ attr: () => undefined }));
		(cheerio.load as vi.Mock).mockReturnValue(mock$);

		// Act
		const result = await imageService.getImageFromUrl(pageUrl);

		// Assert
		expect(result).toBeNull();
		expect(fetch).toHaveBeenCalledOnce(); // Solo se llama al fetch de la página
	});

	it('should return null if fetching the page fails', async () => {
		// Arrange
		const pageUrl = 'https://example.com/not-found';
		(fetch as vi.Mock).mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

		// Act
		const result = await imageService.getImageFromUrl(pageUrl);

		// Assert
		expect(result).toBeNull();
	});

	it('should return null if fetching the image fails', async () => {
		// Arrange
		const pageUrl = 'https://example.com';
		const imageUrl = 'https://example.com/image-not-found.jpg';
		const mockHtml = `<html><head><meta property="og:image" content="${imageUrl}"></head></html>`;

		(fetch as vi.Mock).mockResolvedValueOnce(new Response(mockHtml));
		(fetch as vi.Mock).mockResolvedValueOnce(new Response('Image Not Found', { status: 404 }));

		const mock$ = vi.fn(() => ({ attr: () => imageUrl }));
		(cheerio.load as vi.Mock).mockReturnValue(mock$);

		// Act
		const result = await imageService.getImageFromUrl(pageUrl);

		// Assert
		expect(result).toBeNull();
		expect(fetch).toHaveBeenCalledTimes(2); // Se llama a ambos fetches
	});
});

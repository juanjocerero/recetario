// Ruta: src/lib/server/services/imageService.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { imageService } from './imageService';

// Mock de 'sharp'
vi.mock('sharp', () => {
	const chainable = {
		resize: vi.fn().mockReturnThis(),
		webp: vi.fn().mockReturnThis(),
		toBuffer: vi.fn().mockResolvedValue(Buffer.from('optimized-image-buffer'))
	};
	return {
		default: vi.fn(() => chainable)
	};
});

// Mock global de 'fetch'
global.fetch = vi.fn();
const mockedFetch = vi.mocked(global.fetch);

describe('imageService', () => {
	beforeEach(() => {
		// Limpiamos las llamadas y restauramos las implementaciones por defecto si las hubiera
		vi.clearAllMocks();
		// Justificación: Silenciamos console.error para evitar el ruido en los tests de error.
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		// Restauramos la implementación original de console.error después de cada test.
		vi.mocked(console.error).mockRestore();
	});

	describe('getImageFromUrl', () => {
		it('should return a processed image from an og:image meta tag', async () => {
			const mockPageUrl = 'https://example.com/og-page';
			const mockImageUrl = 'https://example.com/og-image.jpg';
			const mockHtml = `<html><head><meta property="og:image" content="${mockImageUrl}" /></head></html>`;

			// Justificación: Usamos mockImplementation para un mock de fetch más robusto,
			// que no depende del orden de las llamadas.
			mockedFetch.mockImplementation(async (url): Promise<Response> => {
				if (url === mockPageUrl) {
					return new Response(mockHtml);
				}
				if (url === mockImageUrl) {
					return new Response(Buffer.from('image-data'));
				}
				throw new Error(`Unexpected fetch call to ${url}`);
			});

			const result = await imageService.getImageFromUrl(mockPageUrl);

			expect(result).toBe('data:image/webp;base64,b3B0aW1pemVkLWltYWdlLWJ1ZmZlcg==');
			expect(mockedFetch).toHaveBeenCalledWith(mockPageUrl, expect.any(Object));
			expect(mockedFetch).toHaveBeenCalledWith(mockImageUrl);
		});

		it('should return a processed image from a twitter:image meta tag if og:image is not present', async () => {
			const mockPageUrl = 'https://example.com/twitter-page';
			const mockImageUrl = 'https://example.com/twitter-image.jpg';
			const mockHtml = `<html><head><meta name="twitter:image" content="${mockImageUrl}" /></head></html>`;

			mockedFetch.mockImplementation(async (url): Promise<Response> => {
				if (url === mockPageUrl) {
					return new Response(mockHtml);
				}
				if (url === mockImageUrl) {
					return new Response(Buffer.from('image-data'));
				}
				throw new Error(`Unexpected fetch call to ${url}`);
			});

			const result = await imageService.getImageFromUrl(mockPageUrl);

			expect(result).toContain('data:image/webp;base64,');
			expect(mockedFetch).toHaveBeenCalledWith(mockImageUrl);
		});

		it('should return null if no image meta tags are found', async () => {
			const mockPageUrl = 'https://example.com/no-tags';
			const mockHtml = '<html><head></head></html>';

			mockedFetch.mockResolvedValue(new Response(mockHtml));

			const result = await imageService.getImageFromUrl(mockPageUrl);

			expect(result).toBeNull();
			expect(mockedFetch).toHaveBeenCalledOnce();
		});

		it('should return null if fetching the page fails', async () => {
			const mockPageUrl = 'https://example.com/fails';
			mockedFetch.mockRejectedValue(new Error('Network error'));

			const result = await imageService.getImageFromUrl(mockPageUrl);

			expect(result).toBeNull();
		});

		it('should return null if fetching the image fails', async () => {
			const mockPageUrl = 'https://example.com/image-fails';
			const mockImageUrl = 'https://example.com/image.jpg';
			const mockHtml = `<html><head><meta property="og:image" content="${mockImageUrl}" /></head></html>`;

			mockedFetch.mockImplementation(async (url): Promise<Response> => {
				if (url === mockPageUrl) {
					return new Response(mockHtml);
				}
				if (url === mockImageUrl) {
					throw new Error('Image not found');
				}
				throw new Error(`Unexpected fetch call to ${url}`);
			});

			const result = await imageService.getImageFromUrl(mockPageUrl);

			expect(result).toBeNull();
		});
	});
});

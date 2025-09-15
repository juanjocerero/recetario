import { describe, it, expect, vi, beforeEach } from 'vitest';
import { imageService } from './imageService';
import sharp from 'sharp';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

// Mocks
vi.mock('sharp', () => {
	const mockSharp = vi.fn(() => ({
		resize: vi.fn().mockReturnThis(),
		webp: vi.fn().mockReturnThis(),
		toBuffer: vi.fn().mockResolvedValue(Buffer.from('optimized-image')),
		toFile: vi.fn().mockResolvedValue({})
	}));
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	mockSharp.cache = vi.fn();
	return { default: mockSharp };
});

vi.mock('cheerio', () => ({
	load: vi.fn()
}));

vi.mock('fs/promises', () => ({
	default: {
		mkdir: vi.fn().mockResolvedValue(undefined),
		unlink: vi.fn().mockResolvedValue(undefined)
	}
}));

// We will mock fetch globally
global.fetch = vi.fn();

const mockedSharp = vi.mocked(sharp);
const mockedCheerio = vi.mocked(cheerio);
const mockedFs = vi.mocked(fs);
const mockedFetch = vi.mocked(fetch);

describe('imageService', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('getImageFromPageUrl', () => {
		it('should get and process an image from a page URL', async () => {
			const pageUrl = 'http://example.com';
			const imageUrl = 'http://example.com/image.jpg';
			const html = `<html><head><meta property="og:image" content="${imageUrl}"></head></html>`;
			const imageBuffer = Buffer.from('image-data');

			mockedFetch
				// For getImageUrlFromPage
				.mockResolvedValueOnce(new Response(html))
				// For fetchImageAsBuffer
				.mockResolvedValueOnce(new Response(imageBuffer));

			const load = vi.fn().mockReturnValue(vi.fn().mockReturnValue({ attr: () => imageUrl }));
			vi.spyOn(cheerio, 'load').mockImplementation(load);

			const result = await imageService.getImageFromPageUrl(pageUrl);

			expect(mockedFetch).toHaveBeenCalledWith(pageUrl, expect.any(Object));
			expect(mockedFetch).toHaveBeenCalledWith(imageUrl);
			expect(mockedSharp).toHaveBeenCalledWith(imageBuffer);
			expect(result).toBe('data:image/webp;base64,b3B0aW1pemVkLWltYWdl'); // "optimized-image" in base64
		});
	});

	describe('process', () => {
		it('should process an image from a buffer', async () => {
			const imageBuffer = Buffer.from('image-data');
			const result = await imageService.process(imageBuffer);
			expect(mockedSharp).toHaveBeenCalledWith(imageBuffer);
			expect(result).toBe('data:image/webp;base64,b3B0aW1pemVkLWltYWdl');
		});
	});

	describe('saveBase64ImageAsFile', () => {
		it('should save a base64 image as a file', async () => {
			const base64Data = 'data:image/png;base64,someimagedata';
			const slug = 'test-slug';
			const expectedPath = `/images/recipes/${slug}.webp`;

			const result = await imageService.saveBase64ImageAsFile(base64Data, slug);

			expect(mockedFs.mkdir).toHaveBeenCalled();
			expect(mockedSharp).toHaveBeenCalledWith(Buffer.from('someimagedata', 'base64'));
			expect(result).toBe(expectedPath);
		});

		it('should not process a regular URL', async () => {
			const imageUrl = 'http://example.com/image.jpg';
			const slug = 'test-slug';

			const result = await imageService.saveBase64ImageAsFile(imageUrl, slug);

			expect(mockedFs.mkdir).not.toHaveBeenCalled();
			expect(mockedSharp).not.toHaveBeenCalled();
			expect(result).toBe(imageUrl);
		});
	});

	describe('deleteImageFile', () => {
		it('should delete an image file', async () => {
			const imageUrl = '/images/recipes/test.webp';
			await imageService.deleteImageFile(imageUrl);
			const expectedPath = path.join(process.cwd(), 'static', 'images', 'recipes', 'test.webp');
			expect(mockedFs.unlink).toHaveBeenCalledWith(expectedPath);
		});

		it('should not delete a non-local file', async () => {
			const imageUrl = 'http://example.com/image.jpg';
			await imageService.deleteImageFile(imageUrl);
			expect(mockedFs.unlink).not.toHaveBeenCalled();
		});
	});
});

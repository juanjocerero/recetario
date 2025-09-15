import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE as DELETE_many } from './products/+server';
import { PUT, DELETE } from './products/[id]/+server';
import { productService } from '$lib/server/services/productService';
import { json } from '@sveltejs/kit';

// Mock the service
vi.mock('$lib/server/services/productService');

// Mock sveltekit json helper
vi.mock('@sveltejs/kit', async () => {
	const original = await vi.importActual('@sveltejs/kit');
	return {
		...original,
		json: vi.fn((data, init) => new Response(JSON.stringify(data), init))
	};
});

const mockedProductService = vi.mocked(productService);
const mockedJson = vi.mocked(json);

describe('Products API Endpoints', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	// Test GET /api/products
	describe('GET /api/products', () => {
		it('should return a list of products', async () => {
			const products = { products: [{ id: '1', name: 'Test' }], total: 1 };
			mockedProductService.getAll.mockResolvedValue(products);

			const mockEvent = {
				url: new URL('http://localhost/api/products?sort=name&order=asc'),
				request: {}
			};
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			await GET(mockEvent);
			expect(mockedProductService.getAll).toHaveBeenCalledWith(undefined, 'name', 'asc');
			expect(mockedJson).toHaveBeenCalledWith(products);
		});
	});

	// Test POST /api/products
	describe('POST /api/products', () => {
		it('should create a new product', async () => {
			const productData = {
				name: 'New Product',
				calories: 100,
				fat: 10,
				protein: 20,
				carbs: 30
			};
			const newProduct = { id: '2', ...productData };
			mockedProductService.create.mockResolvedValue(newProduct);

			const mockEvent = {
				request: {
					json: async () => productData
				}
			};
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			await POST(mockEvent);
			expect(mockedProductService.create).toHaveBeenCalledWith(productData);
			expect(mockedJson).toHaveBeenCalledWith(newProduct, { status: 201 });
		});
	});

	// Test PUT /api/products/[id]
	describe('PUT /api/products/[id]', () => {
		it('should update a product', async () => {
			const productId = '1';
			const productData = {
				name: 'Updated Product',
				calories: 150,
				fat: 15,
				protein: 25,
				carbs: 35
			};
			const updatedProduct = { id: productId, ...productData };
			mockedProductService.update.mockResolvedValue(updatedProduct);

			const mockEvent = {
				request: {
					json: async () => productData
				},
				params: { id: productId }
			};
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			await PUT(mockEvent);
			expect(mockedProductService.update).toHaveBeenCalledWith(productId, productData);
			expect(mockedJson).toHaveBeenCalledWith(updatedProduct);
		});
	});

	// Test DELETE /api/products/[id]
	describe('DELETE /api/products/[id]', () => {
		it('should delete a product', async () => {
			const productId = '1';
			mockedProductService.delete.mockResolvedValue(null);

			const mockEvent = {
				params: { id: productId }
			};
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const response = await DELETE(mockEvent);
			expect(mockedProductService.delete).toHaveBeenCalledWith(productId);
			expect(response.status).toBe(204);
		});
	});
});

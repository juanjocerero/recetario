import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from './productService';
import prisma from '$lib/server/prisma';
import ky from 'ky';

// Mock Prisma
vi.mock('$lib/server/prisma', () => ({
	default: {
		product: {
			findMany: vi.fn(),
			count: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			findUnique: vi.fn()
		},
		$transaction: vi.fn()
	}
}));

// Mock Ky
vi.mock('ky', () => ({
	default: {
		get: vi.fn()
	}
}));

const mockedPrisma = vi.mocked(prisma);
const mockedKy = vi.mocked(ky);

describe('productService', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('searchByName', () => {
		it('should search for products by name', async () => {
			const query = 'test';
			const expectedProducts = [{ id: '1', name: 'Test Product' }];
			mockedPrisma.product.findMany.mockResolvedValue(expectedProducts);

			const result = await productService.searchByName(query);

			expect(mockedPrisma.product.findMany).toHaveBeenCalledWith({
				where: {
					normalizedName: {
						contains: 'test'
					}
				}
			});
			expect(result).toEqual(expectedProducts);
		});
	});

	describe('getAll', () => {
		it('should get all products with default options', async () => {
			const products = [{ id: '1', name: 'Test Product' }];
			const total = 1;
			mockedPrisma.product.findMany.mockResolvedValue(products);
			mockedPrisma.product.count.mockResolvedValue(total);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.$transaction.mockResolvedValue([products, total]);

			const result = await productService.getAll();

			expect(mockedPrisma.$transaction).toHaveBeenCalledWith([
				mockedPrisma.product.findMany({
					where: {},
					orderBy: { normalizedName: 'asc' },
					take: 50,
					skip: 0
				}),
				mockedPrisma.product.count({ where: {} })
			]);
			expect(result).toEqual({ products, total });
		});
	});

	describe('create', () => {
		it('should create a new product', async () => {
			const productData = { name: 'New Product' };
			const expectedProduct = { id: '1', ...productData, normalizedName: 'new product' };
			mockedPrisma.product.create.mockResolvedValue(expectedProduct);

			const result = await productService.create(productData, '12345');

			expect(mockedPrisma.product.create).toHaveBeenCalledWith({
				data: {
					...productData,
					normalizedName: 'new product',
					barcode: '12345'
				}
			});
			expect(result).toEqual(expectedProduct);
		});
	});

	describe('update', () => {
		it('should update an existing product', async () => {
			const productId = '1';
			const productData = { name: 'Updated Product' };
			const expectedProduct = { id: '1', ...productData, normalizedName: 'updated product' };
			mockedPrisma.product.update.mockResolvedValue(expectedProduct);

			const result = await productService.update(productId, productData);

			expect(mockedPrisma.product.update).toHaveBeenCalledWith({
				where: { id: productId },
				data: {
					...productData,
					normalizedName: 'updated product'
				}
			});
			expect(result).toEqual(expectedProduct);
		});
	});

	describe('delete', () => {
		it('should delete a product', async () => {
			const productId = '1';
			const expectedProduct = { id: '1', name: 'Test Product' };
			mockedPrisma.product.delete.mockResolvedValue(expectedProduct);

			const result = await productService.delete(productId);

			expect(mockedPrisma.product.delete).toHaveBeenCalledWith({
				where: { id: productId }
			});
			expect(result).toEqual(expectedProduct);
		});
	});

	describe('getByIds', () => {
		it('should get products by ids', async () => {
			const ids = ['1', '2'];
			const expectedProducts = [
				{ id: '1', name: 'Test Product 1' },
				{ id: '2', name: 'Test Product 2' }
			];
			mockedPrisma.product.findMany.mockResolvedValue(expectedProducts);

			const result = await productService.getByIds(ids);

			expect(mockedPrisma.product.findMany).toHaveBeenCalledWith({
				where: { id: { in: ids } }
			});
			expect(result).toEqual(expectedProducts);
		});

		it('should return an empty array if no ids are provided', async () => {
			const result = await productService.getByIds([]);
			expect(mockedPrisma.product.findMany).not.toHaveBeenCalled();
			expect(result).toEqual([]);
		});
	});

	describe('findByBarcodeInDbOnly', () => {
		it('should find a product by barcode in the database', async () => {
			const barcode = '12345';
			const expectedProduct = { id: '1', name: 'Test Product', barcode };
			mockedPrisma.product.findUnique.mockResolvedValue(expectedProduct);

			const result = await productService.findByBarcodeInDbOnly(barcode);

			expect(mockedPrisma.product.findUnique).toHaveBeenCalledWith({
				where: { barcode }
			});
			expect(result).toEqual(expectedProduct);
		});
	});

	describe('findByBarcode', () => {
		const barcode = '123456789';
		const productFromDb = {
			id: '1',
			name: 'Cached Product',
			barcode
		};
		const productFromApi = {
			code: barcode,
			product_name: 'API Product',
			image_url: 'http://example.com/image.jpg',
			nutriments: {
				'energy-kcal_100g': 100,
				fat_100g: 10,
				proteins_100g: 20,
				carbohydrates_100g: 30
			}
		};

		it('should return the product from the database if it exists', async () => {
			mockedPrisma.product.findUnique.mockResolvedValue(productFromDb);

			const result = await productService.findByBarcode(barcode);

			expect(result).toEqual(productFromDb);
			expect(mockedPrisma.product.findUnique).toHaveBeenCalledWith({ where: { barcode } });
			expect(mockedKy.get).not.toHaveBeenCalled();
		});

		it('should fetch from the API, create and return the product if not in DB', async () => {
			mockedPrisma.product.findUnique.mockResolvedValue(null);
			const kyGetSpy = vi.spyOn(ky, 'get').mockReturnValue({
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				json: () => Promise.resolve({ status: 1, product: productFromApi })
			});
			const createdProduct = { id: '2', name: 'API Product', barcode };
			mockedPrisma.product.create.mockResolvedValue(createdProduct);

			const result = await productService.findByBarcode(barcode);

			expect(mockedPrisma.product.findUnique).toHaveBeenCalledWith({ where: { barcode } });
			expect(kyGetSpy).toHaveBeenCalledWith(
				`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
			);
			expect(mockedPrisma.product.create).toHaveBeenCalledWith({
				data: {
					name: 'API Product',
					normalizedName: 'api product',
					barcode,
					imageUrl: 'http://example.com/image.jpg',
					calories: 100,
					fat: 10,
					protein: 20,
					carbs: 30
				}
			});
			expect(result).toEqual(createdProduct);
			kyGetSpy.mockRestore();
		});

		it('should return null if product not in DB and API returns no product', async () => {
			mockedPrisma.product.findUnique.mockResolvedValue(null);
			const kyGetSpy = vi.spyOn(ky, 'get').mockReturnValue({
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				json: () => Promise.resolve({ status: 0 })
			});

			const result = await productService.findByBarcode(barcode);

			expect(result).toBeNull();
			expect(mockedPrisma.product.create).not.toHaveBeenCalled();
			kyGetSpy.mockRestore();
		});

		it('should return null if the API call fails', async () => {
			mockedPrisma.product.findUnique.mockResolvedValue(null);
			const kyGetSpy = vi.spyOn(ky, 'get').mockImplementation(() => {
				// Simulate the behavior of ky where the .json() call can fail.
				// This more accurately represents a network or parsing error.
				return {
					json: () => Promise.reject(new Error('API Call Failed'))
				};
			});

			const result = await productService.findByBarcode(barcode);

			expect(result).toBeNull();
			expect(mockedPrisma.product.create).not.toHaveBeenCalled();
			kyGetSpy.mockRestore();
		});
	});
});

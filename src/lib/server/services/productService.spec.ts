// Ruta: src/lib/server/services/productService.spec.ts
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import prisma from '$lib/server/prisma';
import ky from 'ky';
import { productService } from './productService';
import type { Prisma, ProductCache } from '@prisma/client';

// Justificación: Mockeamos los módulos externos para aislar nuestro servicio.
vi.mock('$lib/server/prisma', () => ({
	default: {
		productCache: {
			findUnique: vi.fn(),
			create: vi.fn()
		}
	}
}));

vi.mock('ky', () => ({
	default: {
		get: vi.fn()
	}
}));

const mockedPrisma = prisma;
const mockedKy = ky;

// Definimos los tipos aquí para que el test sea autocontenido.
type OpenFoodFactsProduct = {
	code: string;
	product_name: string;
	brands?: string;
	image_url?: string;
	nutriments: {
		energy_kcal_100g?: number;
		fat_100g?: number;
		proteins_100g?: number;
		carbohydrates_100g?: number;
	};
};

type OpenFoodFactsResponse = {
	status: number;
	product?: OpenFoodFactsProduct;
};

describe('productService', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	const barcode = '123456789';
	const cachedProduct: ProductCache = {
		id: barcode,
		productName: 'Producto en Caché',
		brand: 'Marca Caché',
		imageUrl: 'http://cache.com/img.png',
		calories: 100,
		fat: 10,
		protein: 5,
		carbs: 20,
		fullPayload: {} as Prisma.JsonObject,
		updatedAt: new Date()
	};

	const productFromApi: OpenFoodFactsProduct = {
		code: barcode,
		product_name: 'Producto de API',
		brands: 'Marca API',
		image_url: 'http://api.com/img.png',
		nutriments: {
			energy_kcal_100g: 200,
			fat_100g: 20,
			proteins_100g: 10,
			carbohydrates_100g: 40
		}
	};

	const apiProductResponse: OpenFoodFactsResponse = {
		status: 1,
		product: productFromApi
	};

	it('debería devolver un producto de la caché si existe (Cache Hit)', async () => {
		// Arrange: Hacemos un type cast a Mock para acceder a los métodos de mock de Vitest.
		(mockedPrisma.productCache.findUnique as Mock).mockResolvedValue(cachedProduct);

		// Act
		const result = await productService.findByBarcode(barcode);

		// Assert
		expect(result).toEqual(cachedProduct);
		expect(mockedPrisma.productCache.findUnique).toHaveBeenCalledTimes(1);
		expect(mockedKy.get).not.toHaveBeenCalled();
	});

	it('debería obtener el producto de la API y guardarlo en caché si no existe (Cache Miss)', async () => {
		// Arrange
		(mockedPrisma.productCache.findUnique as Mock).mockResolvedValue(null);

		// Justificación: Se elimina el `as any`. La estructura del objeto es suficiente.
		(mockedKy.get as Mock).mockReturnValue({
			json: vi.fn().mockResolvedValue(apiProductResponse)
		});

		const createdProduct: ProductCache = {
			id: barcode,
			productName: 'Producto de API',
			brand: 'Marca API',
			imageUrl: 'http://api.com/img.png',
			calories: 200,
			fat: 20,
			protein: 10,
			carbs: 40,
			fullPayload: productFromApi as Prisma.JsonObject,
			updatedAt: new Date()
		};
		(mockedPrisma.productCache.create as Mock).mockResolvedValue(createdProduct);

		// Act
		await productService.findByBarcode(barcode);

		// Assert
		expect(mockedPrisma.productCache.findUnique).toHaveBeenCalledTimes(1);
		expect(mockedKy.get).toHaveBeenCalledTimes(1);
		expect(mockedPrisma.productCache.create).toHaveBeenCalledTimes(1);
		expect(mockedPrisma.productCache.create).toHaveBeenCalledWith({
			data: {
				id: productFromApi.code,
				productName: productFromApi.product_name,
				brand: productFromApi.brands,
				imageUrl: productFromApi.image_url,
				calories: productFromApi.nutriments.energy_kcal_100g,
				fat: productFromApi.nutriments.fat_100g,
				protein: productFromApi.nutriments.proteins_100g,
				carbs: productFromApi.nutriments.carbohydrates_100g,
				fullPayload: productFromApi as Prisma.JsonObject
			}
		});
	});
});

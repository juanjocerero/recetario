// Ruta: src/lib/server/services/productService.spec.ts
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import prisma from '$lib/server/prisma';
import ky from 'ky';
import { productService } from './productService';
import type { Prisma, Product } from '@prisma/client';
import { normalizeText } from '$lib/utils';

// Justificación: Mockeamos los módulos externos para aislar nuestro servicio.
vi.mock('$lib/server/prisma', () => ({
	default: {
		product: {
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

vi.mock('$lib/utils', () => ({
	normalizeText: vi.fn((text) => text.toLowerCase())
}));

const mockedPrisma = prisma;
const mockedKy = ky;
const mockedNormalizeText = normalizeText as Mock;

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
	const cachedProduct: Product = {
		id: barcode,
		name: 'Producto en Caché',
		normalizedName: 'producto en caché',
		brand: 'Marca Caché',
		imageUrl: 'http://cache.com/img.png',
		calories: 100,
		fat: 10,
		protein: 5,
		carbs: 20,
		fullPayload: {} as Prisma.JsonValue,
		createdAt: new Date(),
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
		// Arrange
		(mockedPrisma.product.findUnique as Mock).mockResolvedValue(cachedProduct);

		// Act
		const result = await productService.findByBarcode(barcode);

		// Assert
		expect(result).toEqual(cachedProduct);
		expect(mockedPrisma.product.findUnique).toHaveBeenCalledTimes(1);
		expect(mockedKy.get).not.toHaveBeenCalled();
	});

	it('debería obtener el producto de la API y guardarlo en caché si no existe (Cache Miss)', async () => {
		// Arrange
		(mockedPrisma.product.findUnique as Mock).mockResolvedValue(null);
		(mockedKy.get as Mock).mockReturnValue({
			json: vi.fn().mockResolvedValue(apiProductResponse)
		});

		const expectedDataToCreate = {
			id: productFromApi.code,
			name: productFromApi.product_name,
			normalizedName: 'producto de api',
			brand: productFromApi.brands,
			imageUrl: productFromApi.image_url,
			calories: productFromApi.nutriments.energy_kcal_100g,
			fat: productFromApi.nutriments.fat_100g,
			protein: productFromApi.nutriments.proteins_100g,
			carbs: productFromApi.nutriments.carbohydrates_100g,
			fullPayload: productFromApi as unknown as Prisma.JsonValue
		};

		(mockedPrisma.product.create as Mock).mockResolvedValue({
			...expectedDataToCreate,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		mockedNormalizeText.mockReturnValue('producto de api');

		// Act
		await productService.findByBarcode(barcode);

		// Assert
		expect(mockedPrisma.product.findUnique).toHaveBeenCalledTimes(1);
		expect(mockedKy.get).toHaveBeenCalledTimes(1);
		expect(mockedPrisma.product.create).toHaveBeenCalledTimes(1);
		expect(mockedPrisma.product.create).toHaveBeenCalledWith({
			data: expectedDataToCreate
		});
	});

	it('debería devolver null si el producto no se encuentra ni en caché ni en la API', async () => {
		// Arrange
		(mockedPrisma.product.findUnique as Mock).mockResolvedValue(null);
		(mockedKy.get as Mock).mockReturnValue({
			json: vi.fn().mockResolvedValue({ status: 0 }) // Simula producto no encontrado en OFF
		});

		// Act
		const result = await productService.findByBarcode(barcode);

		// Assert
		expect(result).toBeNull();
		expect(mockedPrisma.product.create).not.toHaveBeenCalled();
	});
});

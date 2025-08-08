// Fichero: prisma/seed.ts
console.log('🚀 Seed iniciado...');

import { faker } from '@faker-js/faker';
import { PrismaClient, type Product } from '@prisma/client';
import slugify from 'slugify';
import { normalizeText } from '../src/lib/utils';

const prisma = new PrismaClient();

// =================================================================
// --- FASE 1: OBTENCIÓN DE PRODUCTOS DE OPENFOODFACTS (OFF) ---
// =================================================================

// Tipos para la respuesta de la API de OpenFoodFacts
interface OffNutriments {
	'energy-kcal_100g'?: number;
	proteins_100g?: number;
	fat_100g?: number;
	carbohydrates_100g?: number;
}

interface OffProduct {
	code: string;
	product_name: string;
	nutriments: OffNutriments;
	image_url?: string;
}

interface OffSearchResponse {
	products: OffProduct[];
}

const SEARCH_TERMS_FOR_SEEDING = [
	'Atún claro Hacendado',
	'Tortiglioni Hacendado',
	'Yogur Griego Hacendado',
	'Aceite de Oliva Virgen Extra Hacendado',
	'Leche Entera Hacendado',
	'Galletas María Hacendado',
	'Huevos L Hacendado',
	'Arroz Redondo Hacendado',
	'Pechuga de Pollo Hacendado',
	'Mantequilla sin Sal Hacendado',
	'Pavo en Lonchas Hacendado',
	'Queso Curado Hacendado',
	'Tomate Frito Hacendado',
	'Mayonesa Hacendado',
	'Mostaza Dijon Hacendado',
	'Jamón Serrano Hacendado',
	'Lenteja Pardina Hacendado',
	'Garbanzo Pedrosillano Hacendado',
	'Zumo de Naranja Hacendado',
	'Pan de Molde Hacendado',
	'Cereales de Avena Hacendado',
	'Chocolate Negro 85% Hacendado',
	'Café Molido Hacendado',
	'Guisantes Finos Hacendado',
	'Salmón Ahumado Hacendado'
];

/**
 * Busca un producto en OpenFoodFacts y lo guarda en la base de datos si es válido.
 * @param {string} searchTerm - Término de búsqueda para el producto.
 * @returns {Promise<Product | null>} El producto creado o null si no es válido.
 */
async function fetchAndCreateProduct(searchTerm: string): Promise<Product | null> {
	console.log(`[OFF] Buscando producto para el término: "${searchTerm}"...`);

	const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
		searchTerm
	)}&search_simple=1&action=process&json=1&page_size=5`;

	try {
		const response = await fetch(searchUrl);
		if (!response.ok) {
			throw new Error(`La API de OFF devolvió el estado ${response.status}`);
		}
		const data: OffSearchResponse = await response.json();

		const productData = data.products.find((p: OffProduct) => {
			const nutriments = p.nutriments;
			return (
				p.code &&
				p.product_name &&
				nutriments?.['energy-kcal_100g'] &&
				nutriments?.proteins_100g &&
				nutriments?.fat_100g &&
				nutriments?.carbohydrates_100g
			);
		});

		if (!productData) {
			console.warn(`-> [ADVERTENCIA] No se encontró un producto válido para "${searchTerm}".`);
			return null;
		}

		const barcode = productData.code;
		console.log(`-> [INFO] Producto encontrado: "${productData.product_name}" (${barcode})`);

		const existingProduct = await prisma.product.findUnique({ where: { barcode } });
		if (existingProduct) {
			console.log(`-> [CACHE] El producto "${existingProduct.name}" ya existe. Omitiendo.`);
			return existingProduct;
		}

		const productName = productData.product_name;
		const createdProduct = await prisma.product.create({
			data: {
				name: productName,
				normalizedName: normalizeText(productName),
				barcode: barcode,
				imageUrl: productData.image_url,
				calories: productData.nutriments['energy-kcal_100g'] ?? 0,
				protein: productData.nutriments.proteins_100g ?? 0,
				fat: productData.nutriments.fat_100g ?? 0,
				carbs: productData.nutriments.carbohydrates_100g ?? 0
			}
		});

		console.log(`-> [ÉXITO] Producto "${createdProduct.name}" guardado en la base de datos.`);
		return createdProduct;
	} catch (error) {
		console.error(`-> [ERROR] Fallo al procesar "${searchTerm}":`, (error as Error).message);
		return null;
	}
}

// =================================================================
// --- FASE 2: CREACIÓN DE PRODUCTOS Y RECETAS ---
// =================================================================

const BASE_PRODUCTS = [
	'Pollo', 'Ternera', 'Salmón', 'Lentejas', 'Garbanzos', 'Arroz', 'Quinoa', 'Patata',
	'Brócoli', 'Espinacas', 'Tomate', 'Cebolla', 'Ajo', 'Pimiento', 'Zanahoria', 'Calabacín',
	'Champiñón', 'Huevo', 'Harina de Trigo', 'Azúcar', 'Sal', 'Pimienta Negra', 'Pimentón Dulce',
	'Orégano', 'Perejil Fresco'
];

function createMarkdownSteps(): string[] {
	const numSteps = faker.number.int({ min: 3, max: 6 });
	return Array.from({ length: numSteps }, () => faker.lorem.sentence());
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function main() {
	console.log('--- Limpiando la base de datos... ---');
	await prisma.recipeIngredient.deleteMany();
	await prisma.recipeUrl.deleteMany();
	await prisma.recipe.deleteMany();
	await prisma.product.deleteMany();
	console.log('✅ Base de datos limpia.');

	console.log('\n--- Fase 1: Poblando productos desde OpenFoodFacts... ---');
	const offProducts = (
		await Promise.all(SEARCH_TERMS_FOR_SEEDING.map(fetchAndCreateProduct))
	).filter((p): p is Product => p !== null);
	console.log(`✅ Fase 1 completada. ${offProducts.length} productos de OFF procesados.`);

	console.log('\n--- Fase 2: Creando productos base... ---');
	const baseProducts: Product[] = [];
	for (const name of BASE_PRODUCTS) {
		const productName = name;
		const product = await prisma.product.create({
			data: {
				name: productName,
				normalizedName: normalizeText(productName),
				calories: parseFloat(faker.number.float({ min: 50, max: 500, fractionDigits: 2 }).toFixed(2)),
				protein: parseFloat(faker.number.float({ min: 0, max: 30, fractionDigits: 2 }).toFixed(2)),
				fat: parseFloat(faker.number.float({ min: 0, max: 50, fractionDigits: 2 }).toFixed(2)),
				carbs: parseFloat(faker.number.float({ min: 0, max: 100, fractionDigits: 2 }).toFixed(2))
			}
		});
		baseProducts.push(product);
	}
	console.log(`✅ Fase 2 completada. ${baseProducts.length} productos base creados.`);

	console.log('\n--- Fase 3: Creando recetas de prueba... ---');
	const allAvailableProducts = [...offProducts, ...baseProducts];
	const usedSlugs = new Set<string>();

	for (let i = 0; i < 50; i++) {
		const mainProduct = faker.helpers.arrayElement(allAvailableProducts);
		const recipeTitle = `${mainProduct.name} ${faker.food.adjective()}`;

		const baseSlug = slugify(recipeTitle, { lower: true, strict: true });
		let finalSlug = baseSlug;
		let counter = 2;
		while (usedSlugs.has(finalSlug)) {
			finalSlug = `${baseSlug}-${counter++}`;
		}
		usedSlugs.add(finalSlug);

		const secondaryProducts = faker.helpers.arrayElements(
			allAvailableProducts.filter((p) => p.id !== mainProduct.id),
			faker.number.int({ min: 2, max: 5 })
		);
		const recipeProducts = [mainProduct, ...secondaryProducts];

		console.log(`[RECETA ${i + 1}/50] Creando: "${recipeTitle}"...`);
		await prisma.recipe.create({
			data: {
				title: recipeTitle,
				slug: finalSlug,
				normalizedTitle: normalizeText(recipeTitle),
				steps: createMarkdownSteps(),
				imageUrl: `https://picsum.photos/seed/${encodeURIComponent(recipeTitle)}/400/300`,
				urls: {
					create: [{ url: faker.internet.url() }]
				},
				ingredients: {
					create: recipeProducts.map((p) => ({
						productId: p.id,
						quantity: parseFloat(faker.number.float({ min: 50, max: 500, fractionDigits: 1 }).toFixed(1))
					}))
				}
			}
		});
		await delay(50);
	}
	console.log('✅ Fase 3 completada. 50 recetas creadas.');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		console.log('\n🎉 ¡Seeding completado con éxito! La base de datos está lista para usar.');
	});

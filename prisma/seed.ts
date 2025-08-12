// Fichero: prisma/seed.ts
console.log('🚀 Seed iniciado...');

import { faker } from '@faker-js/faker';
import { PrismaClient, type Product } from '@prisma/client';
import slugify from 'slugify';
import { normalizeText } from '../src/lib/utils';
import { calculateNutritionalInfo } from '../src/lib/recipeCalculator';
import { auth } from '../src/lib/server/auth';

const prisma = new PrismaClient();

// =================================================================
// --- FASE 0: CREACIÓN DE USUARIOS ---
// =================================================================
// Type guard para comprobar de forma segura si un objeto tiene un mensaje de error
function isErrorWithMessage(error: unknown): error is { message: string } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as { message: unknown }).message === 'string'
	);
}

async function createUsers() {
	console.log('--- Limpiando usuarios y sesiones antiguas... ---');
	await prisma.user.deleteMany();
	console.log('✅ Usuarios y sesiones limpiados.');

	console.log('--- Creando usuarios de prueba usando la API de Better Auth... ---');

	// Creamos el usuario administrador
	const adminResult = await auth.api.signUpEmail({
		body: {
			email: 'juanjocerero@gmail.com',
			password: 'admin1234',
			name: 'Admin User'
		}
	});

	if ('user' in adminResult && adminResult.user) {
		await prisma.user.update({
			where: { id: adminResult.user.id },
			data: { role: 'admin' }
		});
		console.log('-> Administrador creado: juanjocerero@gmail.com (Contraseña: admin1234)');
	} else if ('error' in adminResult) {
		const errorMessage = isErrorWithMessage(adminResult.error)
			? adminResult.error.message
			: 'Error desconocido';
		console.error('Error al crear el usuario administrador:', errorMessage);
	}

	// Creamos el usuario estándar
	const userResult = await auth.api.signUpEmail({
		body: {
			email: 'ana.14mp@hotmail.com',
			password: 'user1234',
			name: 'Ana User'
		}
	});

	if ('user' in userResult && userResult.user) {
		await prisma.user.update({
			where: { id: userResult.user.id },
			data: { role: 'user' }
		});
		console.log('-> Usuario creado: ana.14mp@hotmail.com (Contraseña: user1234)');
	} else if ('error' in userResult) {
		const errorMessage = isErrorWithMessage(userResult.error)
			? userResult.error.message
			: 'Error desconocido';
		console.error('Error al crear el usuario estándar:', errorMessage);
	}
}

// =================================================================
// --- FASE 1: OBTENCIÓN DE PRODUCTOS DE OPENFOODFACTS (OFF) ---
// =================================================================

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

async function fetchAndCreateProduct(searchTerm: string): Promise<Product | null> {
	console.log(`[OFF] Buscando producto para el término: "${searchTerm}"...`);
	const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
		searchTerm
	)}&search_simple=1&action=process&json=1&page_size=5`;

	try {
		const response = await fetch(searchUrl);
		if (!response.ok) throw new Error(`La API de OFF devolvió el estado ${response.status}`);
		const data: OffSearchResponse = await response.json();

		const productData = data.products.find(
			(p) =>
				p.code &&
				p.product_name &&
				p.nutriments?.['energy-kcal_100g'] &&
				p.nutriments?.proteins_100g &&
				p.nutriments?.fat_100g &&
				p.nutriments?.carbohydrates_100g
		);

		if (!productData) {
			console.warn(`-> [ADVERTENCIA] No se encontró un producto válido para "${searchTerm}".`);
			return null;
		}

		const existingProduct = await prisma.product.findUnique({ where: { barcode: productData.code } });
		if (existingProduct) {
			console.log(`-> [CACHE] El producto "${existingProduct.name}" ya existe. Omitiendo.`);
			return existingProduct;
		}

		const createdProduct = await prisma.product.create({
			data: {
				name: productData.product_name,
				normalizedName: normalizeText(productData.product_name),
				barcode: productData.code,
				imageUrl: productData.image_url,
				calories: Number(productData.nutriments['energy-kcal_100g']) || 0,
				protein: Number(productData.nutriments.proteins_100g) || 0,
				fat: Number(productData.nutriments.fat_100g) || 0,
				carbs: Number(productData.nutriments.carbohydrates_100g) || 0
			}
		});
		console.log(`-> [ÉXITO] Producto "${createdProduct.name}" guardado.`);
		return createdProduct;
	} catch (error) {
		console.error(`-> [ERROR] Fallo al procesar "${searchTerm}":`, (error as Error).message);
		return null;
	}
}

// =================================================================
// --- FASE 2: CREACIÓN DE PRODUCTOS Y RECETAS (Resto del script) ---
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
	await createUsers();

	console.log('\n--- Limpiando datos antiguos (excepto usuarios)... ---');
	await prisma.diaryEntry.deleteMany();
	await prisma.recipeIngredient.deleteMany();
	await prisma.recipeUrl.deleteMany();
	await prisma.recipe.deleteMany();
	await prisma.product.deleteMany();
	console.log('✅ Datos antiguos limpiados.');

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
	const adminUser = await prisma.user.findUnique({ where: { email: 'juanjocerero@gmail.com' } });

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

	console.log('\n--- Fase 4: Creando entradas de diario de prueba... ---');
	if (adminUser) {
		const allRecipes = await prisma.recipe.findMany({ include: { ingredients: { include: { product: true } } } });
		const allProducts = await prisma.product.findMany();
		const diaryItems = [...allProducts.map(p => ({ ...p, type: 'PRODUCT' as const })), ...allRecipes.map(r => ({ ...r, type: 'RECIPE' as const }))];

		for (let day = 3; day <= 10; day++) {
			const date = new Date(`2025-08-${String(day).padStart(2, '0')}`);
			const numEntries = faker.number.int({ min: 5, max: 10 });
			const selectedItems = faker.helpers.arrayElements(diaryItems, numEntries);

			console.log(`[DIARIO] Creando ${numEntries} entradas para el ${date.toLocaleDateString('es-ES')}...`);

			for (const item of selectedItems) {
				const entryDate = new Date(date);
				entryDate.setHours(faker.number.int({ min: 8, max: 22 }), faker.number.int({ min: 0, max: 59 }));

				if (item.type === 'PRODUCT') {
					const quantity = faker.number.int({ min: 50, max: 250 });
					await prisma.diaryEntry.create({
						data: {
							userId: adminUser.id,
							date: entryDate,
							type: 'PRODUCT',
							name: item.name,
							quantity,
							calories: (item.calories / 100) * quantity,
							protein: (item.protein / 100) * quantity,
							fat: (item.fat / 100) * quantity,
							carbs: (item.carbs / 100) * quantity,
							baseProductId: item.id
						}
					});
				} else {
					const recipeIngredients = item.ingredients.map(ing => ({ quantity: ing.quantity, ...ing.product }));
					const totals = calculateNutritionalInfo(recipeIngredients);
					const totalQuantity = recipeIngredients.reduce((sum, ing) => sum + ing.quantity, 0);
					const ingredientsJson = item.ingredients.map(ing => ({ id: ing.product.id, name: ing.product.name, quantity: ing.quantity, baseValues: { calories: ing.product.calories, protein: ing.product.protein, fat: ing.product.fat, carbs: ing.product.carbs } }));

					await prisma.diaryEntry.create({
						data: {
							userId: adminUser.id,
							date: entryDate,
							type: 'RECIPE',
							name: item.title,
							quantity: totalQuantity,
							calories: totals.totalCalories,
							protein: totals.totalProtein,
							fat: totals.totalFat,
							carbs: totals.totalCarbs,
							ingredients: ingredientsJson,
							baseRecipeId: item.id
						}
					});
				}
			}
		}
		console.log('✅ Fase 4 completada. Entradas de diario creadas.');
	}
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
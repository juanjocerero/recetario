// Fichero: scripts/seed.js
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import sharp from 'sharp';
import fs from 'fs/promises';

const prisma = new PrismaClient();

// =================================================================
// --- FASE 1: OBTENCIÓN DE PRODUCTOS DE OPENFOODFACTS (OFF) ---
// =================================================================

const SEARCH_TERMS_FOR_SEEDING = [
	'Atún Hacendado',
	'Tortiglioni Hacendado',
	'Yogur Hacendado',
	'Aceite Hacendado',
	'Leche Hacendado',
	'Galletas Hacendado',
	'Huevos Hacendado',
	'Arroz Hacendado',
	'Pechuga Hacendado',
	'Mantequilla Hacendado',
	'Pavo Hacendado',
	'Queso Hacendado'
];

/**
 * Busca un producto en OpenFoodFacts y lo guarda en la base de datos si es válido.
 * @param {string} searchTerm - Término de búsqueda para el producto.
 * @returns {Promise<import('@prisma/client').Product | null>} El producto creado o null si no es válido.
 */
async function fetchAndCreateProduct(searchTerm) {
	console.log(`[OFF] Buscando producto para el término: "${searchTerm}"...`);

	const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
		searchTerm
	)}&search_simple=1&action=process&json=1&page_size=5`;

	try {
		const response = await fetch(searchUrl);
		if (!response.ok) {
			throw new Error(`La API de OFF devolvió el estado ${response.status}`);
		}
		const data = await response.json();

		// Buscamos el primer producto que tenga todos los datos que necesitamos
		const productData = data.products.find((p) => {
			const nutriments = p.nutriments;
			return (
				p.code &&
				p.product_name &&
				p.image_url &&
				nutriments &&
				nutriments['energy-kcal_100g'] &&
				nutriments.proteins_100g &&
				nutriments.fat_100g &&
				nutriments.carbohydrates_100g
			);
		});

		if (!productData) {
			console.warn(`-> [ADVERTENCIA] No se encontró un producto válido para "${searchTerm}".`);
			return null;
		}

		const barcode = productData.code;
		console.log(`-> [INFO] Producto encontrado: "${productData.product_name}" (${barcode})`);

		// Comprobar si el producto ya existe en nuestra BD
		const existingProduct = await prisma.product.findUnique({ where: { id: barcode } });
		if (existingProduct) {
			console.log(`-> [CACHE] El producto "${existingProduct.name}" ya existe. Omitiendo.`);
			return existingProduct;
		}

		// Transformar y crear el producto
		const newProduct = {
			id: barcode,
			name: productData.product_name,
			normalizedName: productData.product_name.toLowerCase(),
			isNameManuallySet: false, // Valor por defecto
			brand: productData.brands || 'Marca no especificada',
			imageUrl: productData.image_url,
			calories: productData.nutriments['energy-kcal_100g'] || 0,
			protein: productData.nutriments.proteins_100g || 0,
			fat: productData.nutriments.fat_100g || 0,
			carbs: productData.nutriments.carbohydrates_100g || 0,
			fullPayload: productData
		};

		const createdProduct = await prisma.product.create({ data: newProduct });
		console.log(`-> [ÉXITO] Producto "${createdProduct.name}" guardado en la base de datos.`);
		return createdProduct;
	} catch (error) {
		console.error(`-> [ERROR] Fallo al procesar "${searchTerm}":`, error.message);
		return null;
	}
}

// =================================================================
// --- FASE 2: CREACIÓN DE INGREDIENTES Y RECETAS ---
// =================================================================

const BASE_INGREDIENTS = [
	'Pollo', 'Ternera', 'Salmón', 'Lentejas', 'Garbanzos', 'Arroz',
	'Quinoa', 'Patata', 'Brócoli', 'Espinacas', 'Tomate', 'Cebolla', 'Ajo', 'Pimiento'
];

/**
 * Genera un array de pasos para una receta con formato Markdown.
 * @returns {string[]} Un array de strings con los pasos.
 */
function createMarkdownSteps() {
	const numSteps = faker.number.int({ min: 3, max: 6 });
	const steps = [];
	for (let i = 0; i < numSteps; i++) {
		let stepText = faker.lorem.sentence();
		// Añadir Markdown aleatoriamente
		if (Math.random() > 0.5) {
			const wordToEmphasize = faker.helpers.arrayElement(stepText.split(' '));
			const markdownType = Math.random() > 0.5 ? '**' : '*'; // Negrita o cursiva
			stepText = stepText.replace(wordToEmphasize, `${markdownType}${wordToEmphasize}${markdownType}`);
		}
		steps.push(stepText);
	}
	return steps;
}

/**
 * Descarga una imagen de una URL y la guarda en el disco.
 * @param {string} url - La URL de la imagen a descargar.
 * @param {string} filePath - La ruta local donde guardar la imagen.
 * @returns {Promise<boolean>} `true` si tuvo éxito, `false` si falló.
 */
async function downloadAndSaveImage(url, filePath) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`No se pudo descargar la imagen. Estado: ${response.status}`);
		}
		const imageBuffer = await response.arrayBuffer();
		await sharp(Buffer.from(imageBuffer)).toFile(filePath);
		return true;
	} catch (error) {
		console.error(`-> [ERROR] Fallo al descargar/guardar ${url}:`, error.message);
		return false;
	}
}

/**
 * Pauses execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function main() {
	console.log('--- Limpiando la base de datos y las imágenes de seed... ---');
	// Limpiar la carpeta de imágenes de seed
	await fs.rm('static/images/seed', { recursive: true, force: true });
	await fs.mkdir('static/images/seed', { recursive: true });

	await prisma.recipeIngredient.deleteMany();
	await prisma.recipeUrl.deleteMany();
	await prisma.recipe.deleteMany();
	await prisma.customIngredient.deleteMany();
	await prisma.product.deleteMany();
	console.log('✅ Base de datos y carpeta de imágenes limpias.');

	console.log('\n--- Fase 1: Poblando productos desde OpenFoodFacts... ---');
	const productPromises = SEARCH_TERMS_FOR_SEEDING.map(fetchAndCreateProduct);
	const seededProducts = (await Promise.all(productPromises)).filter(p => p !== null);
	console.log(`✅ Fase 1 completada. ${seededProducts.length} productos de OFF procesados.`);

	console.log('\n--- Fase 2: Creando ingredientes personalizados... ---');
	const customIngredients = [];
	for (const name of BASE_INGREDIENTS) {
		const ingredient = await prisma.customIngredient.create({
			data: {
				name: name,
				normalizedName: name.toLowerCase(),
				calories: parseFloat(faker.number.float({ min: 50, max: 500, precision: 0.1 }).toFixed(1)),
				protein: parseFloat(faker.number.float({ min: 0, max: 30, precision: 0.1 }).toFixed(1)),
				fat: parseFloat(faker.number.float({ min: 0, max: 50, precision: 0.1 }).toFixed(1)),
				carbs: parseFloat(faker.number.float({ min: 0, max: 100, precision: 0.1 }).toFixed(1))
			}
		});
		customIngredients.push(ingredient);
	}
	console.log(`✅ Fase 2 completada. ${customIngredients.length} ingredientes personalizados creados.`);

	console.log('\n--- Fase 3: Creando recetas de prueba... ---');
	const allAvailableIngredients = [
		...seededProducts.map((p) => ({ id: p.id, type: 'product', name: p.name })),
		...customIngredients.map((c) => ({ id: c.id, type: 'custom', name: c.name }))
	];

	const usedSlugs = new Set();

	for (let i = 0; i < 200; i++) {
		const mainIngredient = faker.helpers.arrayElement(allAvailableIngredients);
		const recipeTitle = `${mainIngredient.name} ${faker.food.adjective()}`;

		// --- Lógica de Unicidad de Slug para el Seeding ---
		const baseSlug = slugify(recipeTitle, { lower: true, strict: true });
		let finalSlug = baseSlug;
		let counter = 2;
		while (usedSlugs.has(finalSlug)) {
			finalSlug = `${baseSlug}-${counter}`;
			counter++;
		}
		usedSlugs.add(finalSlug);
		// --- Fin de la lógica de unicidad ---

		// --- Nueva Lógica de Imagen ---
		const imageUrlFromPicsum = `https://picsum.photos/seed/${encodeURIComponent(recipeTitle)}/800/600`;
		const imageFileName = `${finalSlug}.webp`; // Usar .webp para mejor compresión
		const imagePathForDb = `/images/seed/${imageFileName}`;
		const imagePathForFs = `static${imagePathForDb}`;

		// Descargar y guardar la imagen
		const imageSuccess = await downloadAndSaveImage(imageUrlFromPicsum, imagePathForFs);

		// Si la descarga falla, podemos asignar una imagen por defecto o null
		const finalImageUrl = imageSuccess ? imagePathForDb : null;
		// --- Fin de la lógica de imagen ---

		console.log(`[RECETA ${i + 1}/200] Creando: "${recipeTitle}" (slug: ${finalSlug})...
`);
		await prisma.recipe.create({
			data: {
				title: recipeTitle,
				slug: finalSlug,
				normalizedTitle: recipeTitle.toLowerCase(),
				steps: createMarkdownSteps(), // Usamos la nueva función
				imageUrl: finalImageUrl,
				urls: {
					create: [{ url: faker.internet.url() }]
				},
				ingredients: {
					create: recipeIngredients.map((ing) => ({
						productId: ing.type === 'product' ? ing.id : undefined,
						customIngredientId: ing.type === 'custom' ? ing.id : undefined,
						quantity: parseFloat(faker.number.float({ min: 50, max: 500, precision: 1 }).toFixed(1))
					}))
				}
			}
		});

		await delay(100); // Pausa de 100ms para no sobrecargar el servicio de imágenes
	}
	console.log('✅ Fase 3 completada. 200 recetas creadas.');
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
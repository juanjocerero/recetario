// Ruta: scripts/backfill-normalized-names.js

// Justificación: Versión de depuración del script.
// Se añade logging detallado para imprimir los valores que se están comparando.
// Esto es para diagnosticar por qué el script no está actualizando los registros
// cuando se espera que lo haga.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeText(text) {
	if (!text) return '';
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

async function backfillCustomIngredients() {
	console.log('\n--- Iniciando backfill para CustomIngredient ---');
	const ingredients = await prisma.customIngredient.findMany();

	if (ingredients.length === 0) {
		console.log('No hay ingredientes personalizados para procesar.');
		return;
	}

	console.log(`Se encontraron ${ingredients.length} ingredientes personalizados. Analizando...`);
	let updatedCount = 0;
	for (const ingredient of ingredients) {
		const calculatedNormalizedName = normalizeText(ingredient.name);

		console.log(`\n> Procesando: "${ingredient.name}" (ID: ${ingredient.id})`);
		console.log(`  - DB normalizedName:     '${ingredient.normalizedName}'`);
		console.log(`  - Calculado normalizedName: '${calculatedNormalizedName}'`);
		console.log(`  - ¿Son diferentes?:      ${ingredient.normalizedName !== calculatedNormalizedName}`);


		if (ingredient.normalizedName !== calculatedNormalizedName) {
			await prisma.customIngredient.update({
				where: { id: ingredient.id },
				data: { normalizedName: calculatedNormalizedName }
			});
			console.log(`  - ¡ACTUALIZADO!`);
			updatedCount++;
		}
	}
	console.log(`\nTotal de ingredientes personalizados actualizados: ${updatedCount}`);
}

async function backfillProductCache() {
	console.log('\n--- Iniciando backfill para ProductCache ---');
	const products = await prisma.productCache.findMany();

	if (products.length === 0) {
		console.log('No hay productos en caché para procesar.');
		return;
	}

	console.log(`Se encontraron ${products.length} productos en caché. Analizando...`);
	let updatedCount = 0;
	for (const product of products) {
		const calculatedNormalizedName = normalizeText(product.productName);

        console.log(`\n> Procesando: "${product.productName}" (ID: ${product.id})`);
		console.log(`  - DB normalizedProductName:     '${product.normalizedProductName}'`);
		console.log(`  - Calculado normalizedName: '${calculatedNormalizedName}'`);
		console.log(`  - ¿Son diferentes?:      ${product.normalizedProductName !== calculatedNormalizedName}`);

		if (product.normalizedProductName !== calculatedNormalizedName) {
			await prisma.productCache.update({
				where: { id: product.id },
				data: { normalizedProductName: calculatedNormalizedName }
			});
			console.log(`  - ¡ACTUALIZADO!`);
			updatedCount++;
		}
	}
	console.log(`\nTotal de productos en caché actualizados: ${updatedCount}`);
}

async function main() {
	console.log('Iniciando proceso de backfill para todos los modelos normalizados (MODO DEBUG).');
	try {
		await backfillCustomIngredients();
		await backfillProductCache();
		console.log('\nProceso de backfill completado con éxito.');
	} catch (error) {
		console.error('Ocurrió un error durante el proceso de backfill:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();

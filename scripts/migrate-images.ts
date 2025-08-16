// scripts/migrate-images.ts
import { PrismaClient } from '@prisma/client';
import { imageService } from '../src/lib/server/services/imageService';
import { slugify } from '../src/lib/server/slug';

const prisma = new PrismaClient();

async function migrateImages() {
	console.log('Iniciando migración de imágenes...');

	const recipesToMigrate = await prisma.recipe.findMany({
		where: {
			imageUrl: {
				startsWith: 'data:image/'
			}
		}
	});

	if (recipesToMigrate.length === 0) {
		console.log('No hay imágenes para migrar. La base de datos está actualizada.');
		return;
	}

	console.log(`Se encontraron ${recipesToMigrate.length} recetas para migrar.`);

	let successCount = 0;
	let errorCount = 0;

	for (const recipe of recipesToMigrate) {
		try {
			// Aseguramos que el slug sea consistente.
			const slug = recipe.slug || slugify(recipe.title);
			if (!recipe.imageUrl) continue;

			const newImageUrl = await imageService.saveBase64ImageAsFile(recipe.imageUrl, slug);

			if (newImageUrl && newImageUrl !== recipe.imageUrl) {
				await prisma.recipe.update({
					where: { id: recipe.id },
					data: { imageUrl: newImageUrl }
				});
				console.log(`- Receta '${recipe.title}' (ID: ${recipe.id}) migrada a ${newImageUrl}`);
				successCount++;
			} else {
				console.warn(`- No se pudo procesar la imagen para la receta '${recipe.title}' (ID: ${recipe.id}).`);
				errorCount++;
			}
		} catch (error) {
			console.error(`- Error al migrar la receta '${recipe.title}' (ID: ${recipe.id}):`, error);
			errorCount++;
		}
	}

	console.log('\nMigración completada.');
	console.log(`- ${successCount} imágenes migradas con éxito.`);
	console.log(`- ${errorCount} migraciones fallidas.`);
}

migrateImages()
	.catch((e) => {
		console.error('Error fatal durante la migración:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

// Fichero: scripts/seed.js
// Justificación: Se importa `faker` en lugar de `fakerES` para evitar un bug
// interno de la librería en la localización española.
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('Limpiando la base de datos...');
	await prisma.recipeIngredient.deleteMany();
	await prisma.recipeUrl.deleteMany();
	await prisma.recipe.deleteMany();
	await prisma.customIngredient.deleteMany();
	await prisma.product.deleteMany();

	console.log('Creando ingredientes de prueba...');
	const ingredients = [];
	for (let i = 0; i < 10; i++) {
		const ingredientName = faker.food.ingredient();
		const ingredient = await prisma.customIngredient.create({
			data: {
				name: ingredientName,
				normalizedName: ingredientName.toLowerCase(),
				calories: parseFloat(faker.number.float({ min: 50, max: 500, precision: 0.1 }).toFixed(1)),
				protein: parseFloat(faker.number.float({ min: 0, max: 30, precision: 0.1 }).toFixed(1)),
				fat: parseFloat(faker.number.float({ min: 0, max: 50, precision: 0.1 }).toFixed(1)),
				carbs: parseFloat(faker.number.float({ min: 0, max: 100, precision: 0.1 }).toFixed(1))
			}
		});
		ingredients.push(ingredient);
	}
	console.log(`${ingredients.length} ingredientes creados.`);

	console.log('Creando 15 recetas de prueba...');
	for (let i = 0; i < 150; i++) {
		// Justificación: Se construye un título combinando métodos fiables de faker
		// para evitar el que causaba el bug (`faker.food.dish()`).
		const baseTitle = `${faker.food.adjective()} ${faker.food.meat()}`;
		const recipeTitle = baseTitle.charAt(0).toUpperCase() + baseTitle.slice(1);

		const recipe = await prisma.recipe.create({
			data: {
				title: recipeTitle,
				description: faker.lorem.sentence(),
				steps: faker.lorem.paragraphs(3),
				imageUrl: `https://picsum.photos/seed/${encodeURIComponent(recipeTitle)}/800/600`,
				urls: {
					create: [{ url: faker.internet.url() }]
				}
			}
		});

		const numIngredients = faker.number.int({ min: 3, max: 6 });
		const selectedIngredients = faker.helpers.arrayElements(ingredients, numIngredients);

		for (const ingredient of selectedIngredients) {
			await prisma.recipeIngredient.create({
				data: {
					recipeId: recipe.id,
					customIngredientId: ingredient.id,
					quantity: parseFloat(faker.number.float({ min: 50, max: 500, precision: 1 }).toFixed(1))
				}
			});
		}
	}
	console.log('15 recetas creadas.');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		console.log('Seeding completado.');
	});
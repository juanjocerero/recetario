// Fichero: scripts/seed.js
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_INGREDIENTS = [
	'Pollo', 'Ternera', 'Salmón', 'Huevo', 'Lentejas', 'Garbanzos', 'Arroz',
	'Quinoa', 'Patata', 'Brócoli', 'Espinacas', 'Tomate', 'Cebolla', 'Ajo', 'Pimiento'
];

async function main() {
	console.log('Limpiando la base de datos...');
	await prisma.recipeIngredient.deleteMany();
	await prisma.recipeUrl.deleteMany();
	await prisma.recipe.deleteMany();
	await prisma.customIngredient.deleteMany();
	await prisma.product.deleteMany();

	console.log('Creando ingredientes de prueba...');
	const ingredients = [];
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
		ingredients.push(ingredient);
	}
	console.log(`${ingredients.length} ingredientes creados.`);

	console.log('Creando 200 recetas de prueba consistentes...');
	for (let i = 0; i < 200; i++) {
		const mainIngredient = faker.helpers.arrayElement(ingredients);
		const recipeTitle = `${mainIngredient.name} ${faker.food.adjective()}`;
		const otherIngredients = ingredients.filter(ing => ing.id !== mainIngredient.id);
		const secondaryIngredients = faker.helpers.arrayElements(otherIngredients, faker.number.int({ min: 2, max: 4 }));
		const recipeIngredients = [mainIngredient, ...secondaryIngredients];

		await prisma.recipe.create({
			data: {
				title: recipeTitle,
				normalizedTitle: recipeTitle.toLowerCase(),
				description: faker.lorem.sentence(),
				steps: faker.lorem.paragraphs(3),
				imageUrl: `https://picsum.photos/seed/${encodeURIComponent(recipeTitle)}/800/600`,
				urls: {
					create: [{ url: faker.internet.url() }]
				},
				ingredients: {
					create: recipeIngredients.map(ing => ({
						customIngredientId: ing.id,
						quantity: parseFloat(faker.number.float({ min: 50, max: 500, precision: 1 }).toFixed(1))
					}))
				}
			}
		});
	}
	console.log('200 recetas consistentes creadas.');
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

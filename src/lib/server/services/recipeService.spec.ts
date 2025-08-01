// Ruta: src/lib/server/services/recipeService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recipeService } from './recipeService';
import { imageService } from './imageService';
import prisma from '$lib/server/prisma';
import type { RecipeData } from '$lib/schemas/recipeSchema';

// Justificación (Paso 4.2): Mockeamos el imageService para que los tests de recipeService
// no dependan de la red ni de la lógica de extracción de imágenes.
vi.mock('./imageService', () => ({
	imageService: {
		getImageFromUrl: vi.fn()
	}
}));

// Justificación: Usamos una base de datos de prueba en memoria para cada test,
// asegurando un entorno limpio y aislado para cada caso.
beforeEach(async () => {
	// Limpiamos la base de datos antes de cada test
	await prisma.recipeIngredient.deleteMany();
	await prisma.recipeUrl.deleteMany();
	await prisma.recipe.deleteMany();
	await prisma.customIngredient.deleteMany();
	vi.clearAllMocks();
});

const MOCK_RECIPE_DATA: RecipeData = {
	title: 'Test Recipe',
	description: 'A test description',
	steps: 'Step 1. Do this.',
	ingredients: [],
	urls: ['https://example.com/recipe'],
	imageUrl: ''
};

describe('recipeService with images and URLs', () => {
	it('should create a recipe with a user-provided image', async () => {
		// Arrange
		const recipeData = { ...MOCK_RECIPE_DATA, imageUrl: 'data:image/png;base64,test' };

		// Act
		const result = await recipeService.create(recipeData);

		// Assert
		expect(result).toBeDefined();
		expect(result.title).toBe(recipeData.title);
		expect(result.imageUrl).toBe(recipeData.imageUrl);
		expect(imageService.getImageFromUrl).not.toHaveBeenCalled(); // No debe llamar al servicio si la imagen ya viene
	});

	it('should call imageService to get an image if no image is provided but a URL is', async () => {
		// Arrange
		const recipeData = { ...MOCK_RECIPE_DATA, imageUrl: undefined };
		const fetchedImageUrl = 'data:image/webp;base64,fetched-image';
		(imageService.getImageFromUrl as vi.Mock).mockResolvedValue(fetchedImageUrl);

		// Act
		const result = await recipeService.create(recipeData);

		// Assert
		expect(result).toBeDefined();
		expect(imageService.getImageFromUrl).toHaveBeenCalledWith(recipeData.urls![0]);
		expect(result.imageUrl).toBe(fetchedImageUrl);
	});

	it('should create a recipe with URLs', async () => {
		// Arrange
		const recipeData = { ...MOCK_RECIPE_DATA };

		// Act
		const result = await recipeService.create(recipeData);
		const dbRecipe = await prisma.recipe.findUnique({
			where: { id: result!.id },
			include: { urls: true }
		});

		// Assert
		expect(dbRecipe).toBeDefined();
		expect(dbRecipe?.urls).toHaveLength(1);
		expect(dbRecipe?.urls[0].url).toBe(recipeData.urls![0]);
	});

	it('should update a recipe, removing old URLs and adding new ones', async () => {
		// Arrange
		// 1. Creamos una receta inicial con una URL
		const initialRecipe = await prisma.recipe.create({
			data: {
				title: 'Initial',
				steps: 'Initial',
				urls: { create: { url: 'https://initial.com' } }
			}
		});

		// 2. Preparamos los datos de actualización con una nueva URL
		const updateData = {
			...MOCK_RECIPE_DATA,
			title: 'Updated Recipe',
			urls: ['https://updated.com']
		};

		// Act
		const updatedRecipe = await recipeService.update(initialRecipe.id, updateData);

		// Assert
		const dbRecipe = await prisma.recipe.findUnique({
			where: { id: updatedRecipe!.id },
			include: { urls: true }
		});

		expect(dbRecipe).toBeDefined();
		expect(dbRecipe?.title).toBe('Updated Recipe');
		expect(dbRecipe?.urls).toHaveLength(1);
		expect(dbRecipe?.urls[0].url).toBe('https://updated.com'); // La URL antigua fue reemplazada
	});
});

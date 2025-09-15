import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recipeService } from './recipeService';
import prisma from '$lib/server/prisma';
import { imageService } from './imageService';
import { generateUniqueSlug } from '$lib/server/slug';
import { normalizeText } from '$lib/utils';
import type { RecipeData } from '$lib/schemas/recipeSchema';

// Mocks
vi.mock('$lib/server/prisma', () => ({
	default: {
		recipe: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn()
		},
		product: {
			findUnique: vi.fn(),
			create: vi.fn()
		},
		recipeIngredient: {
			deleteMany: vi.fn(),
			createMany: vi.fn()
		},
		recipeUrl: {
			deleteMany: vi.fn(),
			createMany: vi.fn()
		},
		$transaction: vi.fn().mockImplementation(async (callback) => callback(prisma)),
		$queryRaw: vi.fn()
	}
}));

vi.mock('./imageService', () => ({
	imageService: {
		saveBase64ImageAsFile: vi.fn(),
		deleteImageFile: vi.fn()
	}
}));

vi.mock('$lib/server/slug', () => ({
	generateUniqueSlug: vi.fn()
}));

const mockedPrisma = vi.mocked(prisma);
const mockedImageService = vi.mocked(imageService);
const mockedGenerateUniqueSlug = vi.mocked(generateUniqueSlug);

describe('recipeService', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('getAll', () => {
		it('should get all recipes', async () => {
			const expectedRecipes = [{ id: '1', title: 'Test Recipe' }];
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.recipe.findMany.mockResolvedValue(expectedRecipes);

			const result = await recipeService.getAll();

			expect(mockedPrisma.recipe.findMany).toHaveBeenCalledWith({
				include: expect.any(Object),
				orderBy: { title: 'asc' }
			});
			expect(result).toEqual(expectedRecipes);
		});
	});

	describe('getById', () => {
		it('should get a recipe by ID', async () => {
			const recipeId = '1';
			const expectedRecipe = { id: '1', title: 'Test Recipe' };
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.recipe.findUnique.mockResolvedValue(expectedRecipe);

			const result = await recipeService.getById(recipeId);

			expect(mockedPrisma.recipe.findUnique).toHaveBeenCalledWith({
				where: { id: recipeId },
				include: expect.any(Object)
			});
			expect(result).toEqual(expectedRecipe);
		});
	});

	describe('getBySlug', () => {
		it('should get a recipe by slug', async () => {
			const slug = 'test-recipe';
			const expectedRecipe = { id: '1', title: 'Test Recipe', slug };
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.recipe.findUnique.mockResolvedValue(expectedRecipe);

			const result = await recipeService.getBySlug(slug);

			expect(mockedPrisma.recipe.findUnique).toHaveBeenCalledWith({
				where: { slug },
				include: expect.any(Object)
			});
			expect(result).toEqual(expectedRecipe);
		});
	});

	describe('create', () => {
		it('should create a new recipe', async () => {
			const recipeData: RecipeData = {
				title: 'New Recipe',
				steps: 'Steps',
				ingredients: [],
				urls: [],
				imageUrl: 'base64...'
			};
			const slug = 'new-recipe';
			const imageUrl = 'path/to/image.jpg';
			const createdRecipe = { id: '1', ...recipeData, slug, imageUrl };

			mockedGenerateUniqueSlug.mockResolvedValue(slug);
			mockedImageService.saveBase64ImageAsFile.mockResolvedValue(imageUrl);

			// Mock the transaction callback
			mockedPrisma.$transaction.mockImplementation(async (callback) => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				mockedPrisma.recipe.create.mockResolvedValue(createdRecipe);
				return callback(prisma);
			});

			const result = await recipeService.create(recipeData);

			expect(mockedGenerateUniqueSlug).toHaveBeenCalledWith(recipeData.title);
			expect(mockedImageService.saveBase64ImageAsFile).toHaveBeenCalledWith(
				recipeData.imageUrl,
				slug
			);
			expect(mockedPrisma.recipe.create).toHaveBeenCalled();
			expect(result).toEqual(createdRecipe);
		});
	});

	describe('update', () => {
		it('should update an existing recipe', async () => {
			const recipeId = '1';
			const recipeData: RecipeData = {
				title: 'Updated Recipe',
				steps: 'Updated Steps',
				ingredients: [],
				urls: []
			};
			const originalRecipe = { id: recipeId, title: 'Original Recipe', slug: 'original-recipe' };
			const updatedRecipe = { id: recipeId, ...recipeData, slug: 'updated-recipe' };

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.recipe.findUnique.mockResolvedValueOnce(originalRecipe);
			mockedGenerateUniqueSlug.mockResolvedValue('updated-recipe');

			mockedPrisma.$transaction.mockImplementation(async (callback) => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				mockedPrisma.recipe.update.mockResolvedValue(updatedRecipe);
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				mockedPrisma.recipe.findUnique.mockResolvedValue(updatedRecipe);
				return callback(prisma);
			});

			const result = await recipeService.update(recipeId, recipeData);

			expect(mockedGenerateUniqueSlug).toHaveBeenCalledWith(recipeData.title);
			expect(mockedPrisma.recipe.update).toHaveBeenCalled();
			expect(mockedPrisma.recipeIngredient.deleteMany).toHaveBeenCalledWith({
				where: { recipeId }
			});
			expect(mockedPrisma.recipeUrl.deleteMany).toHaveBeenCalledWith({ where: { recipeId } });
			expect(result).toEqual(updatedRecipe);
		});
	});

	describe('deleteById', () => {
		it('should delete a recipe by ID', async () => {
			const recipeId = '1';
			const recipe = { imageUrl: 'path/to/image.jpg' };
			const deletedRecipe = { id: recipeId };
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.recipe.findUnique.mockResolvedValue(recipe);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.recipe.delete.mockResolvedValue(deletedRecipe);

			const result = await recipeService.deleteById(recipeId);

			expect(mockedImageService.deleteImageFile).toHaveBeenCalledWith(recipe.imageUrl);
			expect(mockedPrisma.recipe.delete).toHaveBeenCalledWith({ where: { id: recipeId } });
			expect(result).toEqual(deletedRecipe);
		});
	});

	describe('findPaginated', () => {
		it('should find recipes with pagination', async () => {
			const recipes = [{ id: '1', title: 'Test Recipe' }];
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.recipe.findMany.mockResolvedValue(recipes);

			const result = await recipeService.findPaginated(null, 10, 0);

			expect(mockedPrisma.recipe.findMany).toHaveBeenCalledWith({
				include: expect.any(Object),
				orderBy: { updatedAt: 'desc' },
				take: 10,
				skip: 0
			});
			expect(result).toEqual(recipes);
		});
	});

	describe('findAdvanced', () => {
		it('should find recipes with advanced filters', async () => {
			const rawResult = [{ id: '1', title: 'Test Recipe', imageUrl: null }];
			const finalRecipes = [{ id: '1', title: 'Test Recipe' }];
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.$queryRaw.mockResolvedValue(rawResult);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.recipe.findMany.mockResolvedValue(finalRecipes);

			const result = await recipeService.findAdvanced({
				limit: 10,
				offset: 0
			});

			expect(mockedPrisma.$queryRaw).toHaveBeenCalled();
			expect(mockedPrisma.recipe.findMany).toHaveBeenCalledWith({
				where: { id: { in: ['1'] } },
				include: expect.any(Object)
			});
			expect(result).toEqual(finalRecipes);
		});
	});
});

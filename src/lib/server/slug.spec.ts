import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateUniqueSlug, slugify } from './slug';
import prisma from '$lib/server/prisma';

// Mock Prisma
vi.mock('$lib/server/prisma', () => ({
	default: {
		recipe: {
			findUnique: vi.fn()
		}
	}
}));

const mockedPrisma = vi.mocked(prisma);

describe('slugify', () => {
	it('should create a basic slug', () => {
		expect(slugify('Hello World')).toBe('hello-world');
	});

	it('should handle special characters', () => {
		expect(slugify('Crème brûlée!')).toBe('creme-brulee');
	});
});

describe('generateUniqueSlug', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should return the base slug if it does not exist', async () => {
		mockedPrisma.recipe.findUnique.mockResolvedValue(null);
		const slug = await generateUniqueSlug('New Recipe');
		expect(slug).toBe('new-recipe');
		expect(mockedPrisma.recipe.findUnique).toHaveBeenCalledWith({ where: { slug: 'new-recipe' } });
	});

	it('should append a number if the slug exists', async () => {
		mockedPrisma.recipe.findUnique
			.mockResolvedValueOnce({ id: '1', slug: 'existing-recipe' }) // First call finds a slug
			.mockResolvedValue(null); // Subsequent calls find nothing

		const slug = await generateUniqueSlug('Existing Recipe');
		expect(slug).toBe('existing-recipe-2');
		expect(mockedPrisma.recipe.findUnique).toHaveBeenCalledTimes(2);
		expect(mockedPrisma.recipe.findUnique).toHaveBeenCalledWith({
			where: { slug: 'existing-recipe' }
		});
		expect(mockedPrisma.recipe.findUnique).toHaveBeenCalledWith({
			where: { slug: 'existing-recipe-2' }
		});
	});

	it('should increment the number until a unique slug is found', async () => {
		mockedPrisma.recipe.findUnique
			.mockResolvedValueOnce({ id: '1', slug: 'existing-recipe' })
			.mockResolvedValueOnce({ id: '2', slug: 'existing-recipe-2' })
			.mockResolvedValue(null);

		const slug = await generateUniqueSlug('Existing Recipe');
		expect(slug).toBe('existing-recipe-3');
		expect(mockedPrisma.recipe.findUnique).toHaveBeenCalledTimes(3);
	});
});

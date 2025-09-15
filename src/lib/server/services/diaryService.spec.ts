import { describe, it, expect, vi, beforeEach } from 'vitest';
import { diaryService, type NewDiaryEntryData, type UpdateDiaryEntryData } from './diaryService';
import prisma from '$lib/server/prisma';
import { calculateAggregatedNutrients } from '$lib/utils';
import { getLocalTimeZone } from '@internationalized/date';
import { Prisma } from '@prisma/client';

// Mock Prisma
vi.mock('$lib/server/prisma', () => ({
	default: {
		diaryEntry: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn()
		}
	}
}));

// Mock utils
vi.mock('$lib/utils', () => ({
	calculateAggregatedNutrients: vi.fn()
}));

// Mock date
vi.mock('@internationalized/date', () => ({
	getLocalTimeZone: vi.fn(() => 'UTC')
}));

const mockedPrisma = vi.mocked(prisma);
const mockedCalculateAggregatedNutrients = vi.mocked(calculateAggregatedNutrients);

describe('diaryService', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('getDiaryEntries', () => {
		it('should get diary entries for a user in a date range', async () => {
			const userId = 'user1';
			const startDate = new Date('2024-01-01');
			const endDate = new Date('2024-01-31');
			const expectedEntries = [{ id: '1', name: 'Test Entry' }];
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.diaryEntry.findMany.mockResolvedValue(expectedEntries);

			const result = await diaryService.getDiaryEntries(userId, startDate, endDate);

			expect(mockedPrisma.diaryEntry.findMany).toHaveBeenCalledWith({
				where: {
					userId,
					date: {
						gte: startDate,
						lte: endDate
					}
				},
				orderBy: {
					date: 'asc'
				}
			});
			expect(result).toEqual(expectedEntries);
		});
	});

	describe('getDiaryEntryById', () => {
		it('should get a diary entry by ID', async () => {
			const entryId = '1';
			const expectedEntry = { id: '1', name: 'Test Entry' };
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.diaryEntry.findUnique.mockResolvedValue(expectedEntry);

			const result = await diaryService.getDiaryEntryById(entryId);

			expect(mockedPrisma.diaryEntry.findUnique).toHaveBeenCalledWith({
				where: { id: entryId }
			});
			expect(result).toEqual(expectedEntry);
		});
	});

	describe('addDiaryEntry', () => {
		it('should add a new diary entry', async () => {
			const entryData: NewDiaryEntryData = {
				userId: 'user1',
				date: new Date(),
				type: 'PRODUCT',
				name: 'New Entry',
				quantity: 100,
				calories: 100,
				protein: 10,
				fat: 5,
				carbs: 20
			};
			const expectedEntry = { id: '1', ...entryData };
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.diaryEntry.create.mockResolvedValue(expectedEntry);

			const result = await diaryService.addDiaryEntry(entryData);

			expect(mockedPrisma.diaryEntry.create).toHaveBeenCalledWith({
				data: {
					...entryData,
					ingredients: Prisma.JsonNull,
					baseProductId: undefined,
					baseRecipeId: undefined
				}
			});
			expect(result).toEqual(expectedEntry);
		});
	});

	describe('updateDiaryEntry', () => {
		it('should update an existing diary entry', async () => {
			const entryId = '1';
			const updates: UpdateDiaryEntryData = { name: 'Updated Entry' };
			const expectedEntry = { id: '1', name: 'Updated Entry' };
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.diaryEntry.update.mockResolvedValue(expectedEntry);

			const result = await diaryService.updateDiaryEntry(entryId, updates);

			expect(mockedPrisma.diaryEntry.update).toHaveBeenCalledWith({
				where: { id: entryId },
				data: updates
			});
			expect(result).toEqual(expectedEntry);
		});
	});

	describe('deleteDiaryEntry', () => {
		it('should delete a diary entry', async () => {
			const entryId = '1';
			const expectedEntry = { id: '1', name: 'Test Entry' };
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedPrisma.diaryEntry.delete.mockResolvedValue(expectedEntry);

			const result = await diaryService.deleteDiaryEntry(entryId);

			expect(mockedPrisma.diaryEntry.delete).toHaveBeenCalledWith({
				where: { id: entryId }
			});
			expect(result).toEqual(expectedEntry);
		});
	});

	describe('getAggregatedNutrients', () => {
		it('should calculate aggregated nutrients for a list of entries', () => {
			const entries = [{ id: '1', name: 'Test Entry' }];
			const expectedNutrients = { totalCalories: 100 };
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			mockedCalculateAggregatedNutrients.mockReturnValue(expectedNutrients);

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const result = diaryService.getAggregatedNutrients(entries);

			expect(mockedCalculateAggregatedNutrients).toHaveBeenCalledWith(entries, 'UTC');
			expect(result).toEqual(expectedNutrients);
		});
	});
});

import { describe, it, expect } from 'vitest';
import { calculateAggregatedNutrients, normalizeText } from './utils';

describe('normalizeText', () => {
	it('should convert text to lower case', () => {
		expect(normalizeText('Hello World')).toBe('hello world');
	});

	it('should remove accents', () => {
		expect(normalizeText('Azúcar Moreno')).toBe('azucar moreno');
		expect(normalizeText('Crème brûlée')).toBe('creme brulee');
	});

	it('should handle empty strings', () => {
		expect(normalizeText('')).toBe('');
	});
});

describe('calculateAggregatedNutrients', () => {
	const timezone = 'UTC';

	it('should return all zeros for an empty array of entries', () => {
		const result = calculateAggregatedNutrients([], timezone);
		expect(result).toEqual({
			total: { calories: 0, protein: 0, fat: 0, carbs: 0 },
			average: { calories: 0, protein: 0, fat: 0, carbs: 0 },
			daysWithEntries: 1
		});
	});

	it('should calculate totals and averages for a single entry', () => {
		const entries = [
			{
				date: '2024-01-01T12:00:00Z',
				calories: 100,
				protein: 10,
				fat: 5,
				carbs: 20
			}
		];
		const result = calculateAggregatedNutrients(entries, timezone);
		expect(result).toEqual({
			total: { calories: 100, protein: 10, fat: 5, carbs: 20 },
			average: { calories: 100, protein: 10, fat: 5, carbs: 20 },
			daysWithEntries: 1
		});
	});

	it('should calculate totals and averages for multiple entries on the same day', () => {
		const entries = [
			{
				date: '2024-01-01T12:00:00Z',
				calories: 100,
				protein: 10,
				fat: 5,
				carbs: 20
			},
			{
				date: '2024-01-01T18:00:00Z',
				calories: 200,
				protein: 20,
				fat: 10,
				carbs: 40
			}
		];
		const result = calculateAggregatedNutrients(entries, timezone);
		expect(result).toEqual({
			total: { calories: 300, protein: 30, fat: 15, carbs: 60 },
			average: { calories: 300, protein: 30, fat: 15, carbs: 60 },
			daysWithEntries: 1
		});
	});

	it('should calculate totals and averages for multiple entries on different days', () => {
		const entries = [
			{
				date: '2024-01-01T12:00:00Z',
				calories: 100,
				protein: 10,
				fat: 5,
				carbs: 20
			},
			{
				date: '2024-01-02T12:00:00Z',
				calories: 200,
				protein: 20,
				fat: 10,
				carbs: 40
			}
		];
		const result = calculateAggregatedNutrients(entries, timezone);
		expect(result).toEqual({
			total: { calories: 300, protein: 30, fat: 15, carbs: 60 },
			average: { calories: 150, protein: 15, fat: 7.5, carbs: 30 },
			daysWithEntries: 2
		});
	});
});

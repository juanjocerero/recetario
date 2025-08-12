// Ruta: src/lib/server/services/diaryService.ts
import prisma from '$lib/server/prisma';
import { calculateAggregatedNutrients, type AggregatedNutrients } from '$lib/utils';
import { Prisma, type DiaryEntry } from '@prisma/client';
import { getLocalTimeZone } from '@internationalized/date';

// Tipo para los datos de una nueva entrada del diario
export type NewDiaryEntryData = {
	userId?: string;
	date: Date;
	type: 'PRODUCT' | 'RECIPE';
	name: string;
	quantity: number;
	calories: number;
	protein: number;
	fat: number;
	carbs: number;
	ingredients?: Prisma.JsonValue;
	baseProductId?: string;
	baseRecipeId?: string;
};

// Tipo para las actualizaciones de una entrada
export type UpdateDiaryEntryData = Partial<Omit<NewDiaryEntryData, 'userId' | 'type'>>;

export const diaryService = {
	/**
	* Obtiene las entradas del diario para un usuario en un rango de fechas.
	*/
	async getDiaryEntries(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<DiaryEntry[]> {
		return prisma.diaryEntry.findMany({
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
	},
	
	/**
	* Añade una nueva entrada al diario.
	*/
	async addDiaryEntry(data: NewDiaryEntryData): Promise<DiaryEntry> {
		return prisma.diaryEntry.create({
			data: {
				userId: data.userId,
				date: data.date,
				type: data.type,
				name: data.name,
				quantity: data.quantity,
				calories: data.calories,
				protein: data.protein,
				fat: data.fat,
				carbs: data.carbs,
				ingredients: data.ingredients ?? Prisma.JsonNull,
				baseProductId: data.baseProductId,
				baseRecipeId: data.baseRecipeId
			}
		});
	},
	
	/**
	* Actualiza una entrada existente en el diario.
	*/
	async updateDiaryEntry(
		entryId: string,
		updates: UpdateDiaryEntryData
	): Promise<DiaryEntry | null> {
		const { ingredients, ...rest } = updates;
		
		const data: Prisma.DiaryEntryUpdateInput = {
			...rest
		};
		
		if (ingredients !== undefined) {
			data.ingredients = ingredients ?? Prisma.JsonNull;
		}
		
		return prisma.diaryEntry.update({
			where: { id: entryId },
			data
		});
	},
	
	/**
	* Elimina una entrada del diario.
	*/
	async deleteDiaryEntry(entryId: string): Promise<DiaryEntry | null> {
		return prisma.diaryEntry.delete({
			where: { id: entryId }
		});
	},
	
	/**
	* Calcula los nutrientes totales y promedio de una lista de entradas.
	* Es un wrapper sobre la función de utilidades.
	*/
	getAggregatedNutrients(entries: DiaryEntry[]): AggregatedNutrients {
		const timezone = getLocalTimeZone();
		return calculateAggregatedNutrients(entries, timezone);
	}
};

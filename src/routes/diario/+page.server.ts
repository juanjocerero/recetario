// Ruta: src/routes/diario/+page.server.ts
import { diaryService } from '$lib/server/services/diaryService';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Temporalmente, usamos un userId de prueba.
	const userId = 'test-user';

	const today = new Date();
	const startDate = new Date(today.setHours(0, 0, 0, 0));
	const endDate = new Date(today.setHours(23, 59, 59, 999));

	const entries = await diaryService.getDiaryEntries(userId, startDate, endDate);
	const aggregatedNutrients = diaryService.getAggregatedNutrients(entries);

	return {
		entries,
		aggregatedNutrients
	};
};

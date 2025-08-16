// Ruta: src/routes/diario/+page.server.ts
import { diaryService } from '$lib/server/services/diaryService';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// El hook `hooks.server.ts` ya se asegura de que `locals.session` exista.
	const userId = locals.session!.user.id;

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

// src/routes/api/ingredients/details/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ingredientService } from '$lib/server/services/ingredientService';

export const GET: RequestHandler = async ({ url }) => {
	const idsParam = url.searchParams.get('ids');
	if (!idsParam) {
		return json({ message: 'Missing "ids" query parameter' }, { status: 400 });
	}

	const ids = idsParam.split(',').filter(Boolean); // filter(Boolean) to remove empty strings
	if (ids.length === 0) {
		return json([]);
	}

	try {
		// The service now handles fetching by CUID directly
		const ingredients = await ingredientService.getByIds(ids);
		return json(ingredients);
	} catch (error) {
		console.error('Failed to fetch ingredient details:', error);
		return json({ message: 'An error occurred while fetching ingredient details.' }, { status: 500 });
	}
};

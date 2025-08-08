// src/routes/api/ingredients/details/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { productService } from '$lib/server/services/productService';

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
		const products = await productService.getByIds(ids);
		return json(products);
	} catch (error) {
		console.error('Failed to fetch product details:', error);
		return json({ message: 'An error occurred while fetching product details.' }, { status: 500 });
	}
};

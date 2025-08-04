// Ruta: src/routes/+layout.server.ts
import { verifyToken } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const token = cookies.get('session');
	let user = null;

	if (token) {
		user = await verifyToken(token);
	}

	return {
		theme: cookies.get('theme'),
		user
	};
};

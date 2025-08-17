// Ruta: src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// locals.session contiene tanto la información de la sesión como el objeto del usuario.
	// Los devolvemos como propiedades separadas para que estén disponibles en `data.user` y `data.session`.
	return {
		user: locals.session?.user,
		session: locals.session?.session,
		urlHref: url.href
	};
};
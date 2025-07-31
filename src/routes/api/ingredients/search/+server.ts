// Ruta: src/routes/api/ingredients/search/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import { normalizeText } from '$lib/utils';

// Justificación: Este endpoint es crucial para la UX del formulario de recetas.
// Permite una búsqueda de texto (usando 'contains' case-insensitive)
// contra los ingredientes personalizados y los productos en caché,
// devolviendo una lista unificada que el frontend puede mostrar como sugerencias.

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');

	// Justificación (Validación): Se requiere un query y que tenga una longitud mínima
	// para evitar búsquedas vacías o excesivamente amplias que sobrecarguen la base de datos.
	if (!query || query.length < 3) {
		return json(
			{ message: 'Se requiere un término de búsqueda de al menos 3 caracteres.' },
			{ status: 400 }
		);
	}

	// Justificación: Normalizamos el término de búsqueda del usuario de la misma forma
	// que normalizamos los datos en la DB. Esto es clave para que la búsqueda
	// insensible a acentos funcione correctamente.
	const normalizedQuery = normalizeText(query);

	try {
		// Justificación (Búsqueda paralela): Ejecutamos ambas búsquedas en paralelo
		// con Promise.all para minimizar la latencia de la respuesta.
		const [customIngredients, cachedProducts] = await Promise.all([
			prisma.customIngredient.findMany({
				where: {
					normalizedName: {
						contains: normalizedQuery
					}
				},
				take: 20, // Limitar el número de resultados por rendimiento
				select: { id: true, name: true }
			}),
			prisma.productCache.findMany({
				where: {
					normalizedProductName: {
						contains: normalizedQuery
					}
				},
				take: 20,
				select: { id: true, productName: true }
			})
		]);

		// Justificación (Formato Unificado): Mapeamos los resultados de ambas tablas
		// a un formato consistente. El campo 'type' es esencial para que el frontend
		// sepa cómo manejar cada ingrediente al añadirlo a la receta.
		const formattedCustom = customIngredients.map((ing) => ({
			id: ing.id,
			name: ing.name,
			type: 'custom' as const
		}));

		const formattedProducts = cachedProducts.map((prod) => ({
			id: prod.id,
			name: prod.productName,
			type: 'product' as const
		}));

		const results = [...formattedCustom, ...formattedProducts];

		return json(results);
	} catch (error) {
		console.error('Error searching ingredients:', error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

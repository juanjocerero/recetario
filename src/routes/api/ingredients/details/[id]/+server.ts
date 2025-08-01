// Ruta: src/routes/api/ingredients/details/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

// Justificación: Este endpoint centraliza la obtención de datos nutricionales
// para cualquier tipo de ingrediente. El frontend lo necesita para poder
// calcular la información nutricional en tiempo real al crear/editar una receta.
export const GET: RequestHandler = async ({ params, url }) => {
	const { id } = params;
	const type = url.searchParams.get('type');

	if (!type || (type !== 'custom' && type !== 'product')) {
		return json({ message: "El parámetro 'type' es requerido ('custom' o 'product')." }, { status: 400 });
	}

	try {
		let ingredientData = null;
		if (type === 'custom') {
			ingredientData = await prisma.customIngredient.findUnique({
				where: { id }
			});
		} else {
			// Para productos, el 'id' es el código de barras.
			ingredientData = await prisma.productCache.findUnique({
				where: { id }
			});
		}

		if (!ingredientData) {
			return json({ message: 'Ingrediente no encontrado.' }, { status: 404 });
		}

		// Justificación: Devolvemos un objeto con una estructura consistente,
		// independientemente de la tabla de origen, para que el frontend
		// pueda procesarlo de forma sencilla.
		const response = {
			calories: ingredientData.calories,
			protein: ingredientData.protein,
			fat: ingredientData.fat,
			carbs: ingredientData.carbs
		};

		return json(response);
	} catch (error) {
		console.error(`Error fetching ingredient details for id ${id}:`, error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

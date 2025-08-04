// Ruta: src/routes/api/ingredients/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { ingredientService } from '$lib/server/services/ingredientService';
import { IngredientSchema } from '$lib/schemas/ingredientSchema';
import { ZodError } from 'zod';
// Justificación: Se importa la nueva utilidad unificada.
import { createFailResponse } from '$lib/server/zodErrors';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const search = url.searchParams.get('search') ?? undefined;
		const sort = url.searchParams.get('sort') ?? 'name';
		const order = url.searchParams.get('order') ?? 'asc';

		const ingredients = await ingredientService.getAllUnified(search, sort, order);
		return json(ingredients);
	} catch (error) {
		console.error('Error fetching ingredients:', error);
		// Justificación: Se usa la nueva utilidad para unificar la respuesta de error.
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const validatedData = IngredientSchema.parse(body);
		const newIngredient = await ingredientService.create(validatedData);
		return json(newIngredient, { status: 201 });
	} catch (error) {
		if (error instanceof ZodError) {
			// Justificación: Se usa la nueva utilidad para el error de validación.
			return json(createFailResponse('La validación falló', error), { status: 400 });
		}
		console.error('Error creating ingredient:', error);
		// Justificación: Se usa la nueva utilidad para unificar la respuesta de error.
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { id, source } = await request.json();

		if (!id || !source) {
			return json(createFailResponse('Faltan los campos "id" y "source"'), { status: 400 });
		}

		if (source === 'custom') {
			await ingredientService.deleteById(id);
		} else if (source === 'product') {
			const productId = id.startsWith('product-') ? id.substring(8) : id;
			await ingredientService.deleteProductById(productId);
		} else {
			return json(createFailResponse('Tipo de ingrediente no válido.'), { status: 400 });
		}

		return json({ success: true, message: 'Ingrediente eliminado con éxito' }, { status: 200 });
	} catch (error) {
		console.error('Error al eliminar el ingrediente:', error);
		return json(createFailResponse('Error interno del servidor'), { status: 500 });
	}
};
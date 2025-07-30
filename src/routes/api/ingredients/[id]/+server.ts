// Ruta: src/routes/api/ingredients/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { ingredientService } from '$lib/server/services/ingredientService';
import { IngredientSchema } from '$lib/schemas/ingredientSchema';
import { ZodError } from 'zod';

// Justificación (PUT): Endpoint para la actualización de un recurso específico.
// Valida tanto el ID de la ruta como los datos del cuerpo antes de actuar.
export const PUT: RequestHandler = async ({ request, params }) => {
	const { id } = params;
	if (!id) {
		return json({ message: 'ID de ingrediente es requerido' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const validatedData = IngredientSchema.parse(body);

		const updatedIngredient = await ingredientService.update(id, validatedData);
		return json(updatedIngredient);
	} catch (error) {
		if (error instanceof ZodError) {
			return json({ errors: error.flatten().fieldErrors }, { status: 400 });
		}
		// Aquí podrías manejar errores específicos de Prisma, como 'RecordNotFound'.
		console.error(`Error updating ingredient ${id}:`, error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

// Justificación (DELETE): Endpoint para la eliminación de un recurso específico.
// Solo requiere el ID del recurso, haciendo la operación simple y clara.
export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;
	if (!id) {
		return json({ message: 'ID de ingrediente es requerido' }, { status: 400 });
	}

	try {
		await ingredientService.deleteById(id);
		return new Response(null, { status: 204 }); // 204 No Content
	} catch (error) {
		// Aquí también se podrían manejar errores de 'RecordNotFound'.
		console.error(`Error deleting ingredient ${id}:`, error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

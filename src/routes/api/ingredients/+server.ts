// Ruta: src/routes/api/ingredients/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { ingredientService } from '$lib/server/services/ingredientService';
import { IngredientSchema } from '$lib/schemas/ingredientSchema';
import { ZodError } from 'zod';

// Justificación (GET): Este endpoint expone la lista de ingredientes personalizados.
// Sigue el patrón REST para obtener colecciones de recursos.
export const GET: RequestHandler = async () => {
	try {
		const ingredients = await ingredientService.getAll();
		return json(ingredients);
	} catch (error) {
		// Manejo de errores inesperados en el servidor.
		console.error('Error fetching ingredients:', error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

// Justificación (POST): Este endpoint permite la creación de nuevos ingredientes.
// Valida los datos de entrada usando Zod antes de pasarlos a la capa de servicio.
// Esto asegura la integridad de los datos antes de llegar a la base de datos.
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		// El servicio ya se encarga de la validación, pero una validación temprana aquí
		// permite devolver un error más claro y específico.
		const validatedData = IngredientSchema.parse(body);

		const newIngredient = await ingredientService.create(validatedData);
		return json(newIngredient, { status: 201 }); // 201 Created
	} catch (error) {
		if (error instanceof ZodError) {
			// Si la validación de Zod falla, devolvemos un error 400 con los detalles.
			return json({ errors: error.flatten().fieldErrors }, { status: 400 });
		}
		// Manejo de otros errores, como los de la base de datos.
		console.error('Error creating ingredient:', error);
		return json({ message: 'Error interno del servidor' }, { status: 500 });
	}
};

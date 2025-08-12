import { z } from 'zod';
import { productService } from '$lib/server/services/productService';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

const addProductSchema = z.object({
	barcode: z.string(),
	name: z.string().min(1, 'El nombre no puede estar vacío'),
	imageUrl: z.string().url().optional().or(z.literal('')),
	calories: z.coerce.number().min(0, 'Las calorías deben ser un número positivo'),
	protein: z.coerce.number().min(0, 'Las proteínas deben ser un número positivo'),
	fat: z.coerce.number().min(0, 'Las grasas deben ser un número positivo'),
	carbs: z.coerce.number().min(0, 'Los carbohidratos deben ser un número positivo')
});

export const actions: Actions = {
	// Acción para añadir un producto de OFF a nuestra base de datos
	add: async ({ request }) => {
		const data = await request.formData();
		const parsed = addProductSchema.safeParse(Object.fromEntries(data));
		
		if (!parsed.success) {
			const error = parsed.error.flatten().fieldErrors;
			return fail(400, { success: false, error: Object.values(error).flat().join(', ') });
		}
		
		try {
			// Comprobar si ya existe un producto con ese barcode
			const existingProduct = await productService.findByBarcodeInDbOnly(parsed.data.barcode);
			if (existingProduct) {
				return fail(409, { success: false, error: 'Ya existe un producto con este código de barras.' });
			}
			
			const newProduct = await productService.create(parsed.data);
			
			return { success: true, product: newProduct };
		} catch (error) {
			console.error(error);
			return fail(500, {
				success: false,
				error: 'Error interno del servidor al crear el producto.'
			});
		}
	}
};

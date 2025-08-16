// Ruta: src/lib/schemas/diarySchema.ts
import { z } from 'zod';

/**
* Esquema para validar la creación y actualización de una entrada en el diario.
* Se usa `z.coerce.date()` para convertir automáticamente strings de fecha a objetos Date.
*/
export const DiaryEntrySchema = z.object({
	date: z.coerce.date(),
	type: z.enum(['PRODUCT', 'RECIPE']),
	name: z.string().min(1, 'El nombre no puede estar vacío.'),
	quantity: z.number().positive('La cantidad debe ser un número positivo.'),
	calories: z.number().min(0, 'Las calorías no pueden ser negativas.'),
	protein: z.number().min(0, 'La proteína no puede ser negativa.'),
	fat: z.number().min(0, 'La grasa no puede ser negativa.'),
	carbs: z.number().min(0, 'Los carbohidratos no pueden ser negativos.'),
	
	// El campo de ingredientes es opcional y puede tener cualquier estructura JSON.
	ingredients: z.any().optional(),
	
	baseProductId: z.string().optional(),
	baseRecipeId: z.string().optional()
});

/**
 * Esquema para validar la actualización de una entrada en el diario.
 * Todos los campos son opcionales.
 */
export const UpdateDiaryEntrySchema = DiaryEntrySchema.partial();

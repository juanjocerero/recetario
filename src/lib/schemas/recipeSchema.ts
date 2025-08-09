// Ruta: src/lib/schemas/recipeSchema.ts
import { z } from 'zod';

// Justificación: Este es el esquema para un único ingrediente DENTRO de una receta.
// Es el Data Transfer Object (DTO) que esperamos del frontend.
const RecipeIngredientSchema = z.object({
	id: z.string(),
	quantity: z.coerce.number().positive({ message: 'La cantidad debe ser mayor que cero.' }),
	source: z.enum(['local', 'off'])
});

// Justificación: Esquema principal para la creación y actualización de recetas.
// Valida la estructura completa del objeto que se enviará a la API.
export const RecipeSchema = z.object({
	title: z.string().min(1, { message: 'El título no puede estar vacío.' }),
	steps: z
		.array(z.string().min(1, { message: 'El paso no puede estar vacío.' }))
		.min(1, { message: 'Debe haber al menos un paso.' }),
	ingredients: z
		.array(RecipeIngredientSchema)
		.min(1, { message: 'La receta debe tener al menos un ingrediente.' }),
	// Justificación (Paso 3.1): Añadimos la validación para la URL de la imagen.
	// Debe ser una cadena opcional que puede ser un data URL.
	imageUrl: z.string().optional(),
	// Justificación (Paso 3.1): Añadimos la validación para las URLs de referencia.
	// Debe ser un array de strings que sean URLs válidas.
	urls: z.array(z.string().url({ message: 'La URL no es válida.' })).optional()
});

// Exportamos los tipos inferidos para usarlos en el código sin tener que
// depender directamente de Zod, mejorando el desacoplamiento.
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;
export type RecipeData = z.infer<typeof RecipeSchema>;
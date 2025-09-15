// Ruta: src/lib/schemas/recipeSchema.ts
import { z } from 'zod';

// Justificación: Para manejar ingredientes de distintas fuentes, se utiliza un
// discriminated union. Esto permite que el esquema varíe según el valor
// del campo 'source', asegurando que los datos para cada tipo de ingrediente
// sean correctos.

// Esquema para ingredientes que ya existen en la base de datos local.
const LocalIngredientSchema = z.object({
	source: z.literal('local'),
	id: z.string().cuid(), // El CUID del producto en nuestra BD
	quantity: z.coerce.number().positive()
});

// Esquema para ingredientes nuevos obtenidos de Open Food Facts (OFF).
// Incluye todos los campos necesarios para crear un nuevo producto.
const OffIngredientSchema = z.object({
	source: z.literal('off'),
	id: z.string(), // El código de barras del producto en OFF
	name: z.string(),
	quantity: z.coerce.number().positive(),
	calories: z.coerce.number().min(0),
	protein: z.coerce.number().min(0),
	carbs: z.coerce.number().min(0),
	fat: z.coerce.number().min(0),
	imageUrl: z.string().url().optional().nullable()
});

// El esquema de ingrediente final es la unión de los dos tipos.
const RecipeIngredientSchema = z.discriminatedUnion('source', [
	LocalIngredientSchema,
	OffIngredientSchema
]);

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
// Ruta: src/lib/schemas/productSchema.ts
import { z } from 'zod';

// Justificación: Se exporta como 'const' para que sea un valor en tiempo de ejecución.
// Esto permite que otros módulos lo importen para usarlo en funciones como 'z.infer'
// y para la validación de datos. 'verbatimModuleSyntax' en tsconfig.json lo requiere.
export const ProductSchema = z.object({
	name: z.string().min(1, { message: 'El nombre no puede estar vacío.' }),
	// Usamos z.coerce.number() para convertir la entrada (que puede ser string) a número.
	calories: z.coerce.number().min(0, { message: 'Las calorías no pueden ser negativas.' }),
	fat: z.coerce.number().min(0, { message: 'La grasa no puede ser negativa.' }),
	protein: z.coerce.number().min(0, { message: 'La proteína no puede ser negativa.' }),
	carbs: z.coerce.number().min(0, { message: 'Los carbohidratos no pueden ser negativos.' }),
	imageUrl: z.string().url({ message: 'Debe ser una URL válida' }).nullable().optional()
});

// Exportamos también el tipo inferido para usarlo en el frontend o donde se necesite
// la forma de los datos sin importar el validador.
export type Product = z.infer<typeof ProductSchema>;
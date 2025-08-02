// Fichero: src/lib/schemas/searchSchema.ts
import { z } from 'zod';

// Justificación: Se define un esquema de Zod para validar el cuerpo (body)
// de las peticiones de búsqueda avanzada. Esto asegura que los datos que llegan
// al endpoint tienen la forma correcta, previniendo errores y ataques.

const MacroFilterSchema = z.object({
	min: z.coerce.number().optional(),
	max: z.coerce.number().optional()
});

export const SearchFiltersSchema = z.object({
	ingredients: z.array(z.string()).optional(),
	calories: MacroFilterSchema.optional(),
	protein: MacroFilterSchema.optional(),
	carbs: MacroFilterSchema.optional(),
	fat: MacroFilterSchema.optional(),
	sortBy: z.string().optional(),
	limit: z.coerce.number().default(50),
	offset: z.coerce.number().default(0)
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

// Fichero: src/lib/schemas/searchSchema.ts
import { z } from 'zod';

// Justificación: Se define un esquema de Zod para validar el cuerpo (body)
// de las peticiones de búsqueda avanzada. Esto asegura que los datos que llegan
// al endpoint tienen la forma correcta, previniendo errores y ataques.

const RangeFilterSchema = z.object({
	min: z.coerce.number().optional(),
	max: z.coerce.number().optional()
});

const GramsFilterSchema = z.object({
	calories: RangeFilterSchema.optional(),
	protein: RangeFilterSchema.optional(),
	carbs: RangeFilterSchema.optional(),
	fat: RangeFilterSchema.optional()
});

const PercentFilterSchema = z.object({
	protein: RangeFilterSchema.optional(),
	carbs: RangeFilterSchema.optional(),
	fat: RangeFilterSchema.optional()
});

const SortByEnum = z.enum([
	'title_asc',
	'title_desc',
	'calories_asc',
	'calories_desc',
	'protein_grams_asc',
	'protein_grams_desc',
	'fat_grams_asc',
	'fat_grams_desc',
	'carbs_grams_asc',
	'carbs_grams_desc',
	'protein_percent_asc',
	'protein_percent_desc',
	'fat_percent_asc',
	'fat_percent_desc',
	'carbs_percent_asc',
	'carbs_percent_desc'
]);

export const SearchFiltersSchema = z.object({
	ingredients: z.array(z.string()).optional(),
	grams: GramsFilterSchema.optional(),
	percent: PercentFilterSchema.optional(),
	sortBy: SortByEnum.default('title_asc'),
	limit: z.coerce.number().default(50),
	offset: z.coerce.number().default(0)
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
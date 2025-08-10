// Ruta: src/lib/models/recipe.ts
import type { Prisma } from '@prisma/client';

/**
 * Constante de Prisma para incluir las relaciones de ingredientes (con sus productos) y URLs
 * al consultar una receta. Se exporta para ser reutilizada.
 */
export const recipeInclude = {
	ingredients: {
		include: {
			product: true
		}
	},
	urls: true
} satisfies Prisma.RecipeInclude;

/**
 * Tipo que representa una receta completa con todas sus relaciones,
 * derivado automáticamente del `recipeInclude`.
 */
export type FullRecipe = Prisma.RecipeGetPayload<{
	include: typeof recipeInclude;
}>;

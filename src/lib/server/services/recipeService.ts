// Ruta: src/lib/server/services/recipeService.ts
import prisma from '$lib/server/prisma';
import { Prisma } from '@prisma/client';
import type { SearchFilters as ZodSearchFilters } from '$lib/schemas/searchSchema';
import type { RecipeData } from '$lib/schemas/recipeSchema';
import { generateUniqueSlug } from '$lib/server/slug';

const recipeInclude = {
	ingredients: {
		include: {
			product: true,
			customIngredient: true
		}
	},
	urls: true
};

// Justificación: Se usa Prisma.RecipeGetPayload para generar automáticamente
// el tipo correcto que corresponde a la consulta, incluyendo las relaciones.
// Esto es más robusto y menos propenso a errores que definir el tipo manualmente.
type FullRecipe = Prisma.RecipeGetPayload<{
	include: typeof recipeInclude;
}>;

// --- Tipos para Búsqueda Avanzada ---
export type MacroFilter = {
	min?: number;
	max?: number;
};

export type AdvancedSearchFilters = ZodSearchFilters;

type RawRecipeQueryResult = {
	id: string;
	title: string;
	imageUrl: string | null;
};

export const recipeService = {
	async getAll(): Promise<FullRecipe[]> {
		return await prisma.recipe.findMany({
			include: recipeInclude,
			orderBy: { title: 'asc' }
		});
	},

	async getById(id: string): Promise<FullRecipe | null> {
		return await prisma.recipe.findUnique({
			where: { id },
			include: recipeInclude
		});
	},

	async getBySlug(slug: string): Promise<FullRecipe | null> {
		return await prisma.recipe.findUnique({
			where: { slug },
			include: recipeInclude
		});
	},

	async create(data: RecipeData): Promise<FullRecipe> {
		const { title, steps, ingredients, urls, imageUrl } = data;
		const slug = await generateUniqueSlug(title);

		const createdRecipe = await prisma.$transaction(async (tx) => {
			const newRecipe = await tx.recipe.create({
				data: {
					title,
					slug,
					normalizedTitle: title.toLowerCase(),
					steps,
					imageUrl,
					urls: {
						create: urls?.map((url: string) => ({ url }))
					}
				}
			});

			// Preparamos los datos para la inserción en lote
			const ingredientsData = ingredients.map((ingredient) => ({
				recipeId: newRecipe.id,
				quantity: ingredient.quantity,
				productId: ingredient.type === 'product' ? ingredient.id : null,
				customIngredientId: ingredient.type === 'custom' ? ingredient.id : null
			}));

			// Insertamos todos los ingredientes en una sola operación
			await tx.recipeIngredient.createMany({
				data: ingredientsData
			});

			return newRecipe;
		});

		// Después de la transacción, obtenemos la receta completa con todas sus relaciones
		const fullNewRecipe = await prisma.recipe.findUnique({
			where: { id: createdRecipe.id },
			include: recipeInclude
		});

		if (!fullNewRecipe) {
			// Esto no debería ocurrir si la transacción tuvo éxito, pero es un seguro
			throw new Error('No se pudo encontrar la receta recién creada.');
		}

		return fullNewRecipe;
	},

	async update(id: string, data: RecipeData) {
		const { title, steps, ingredients, urls, imageUrl } = data;

		// Comprobar si el título ha cambiado para regenerar el slug
		const originalRecipe = await prisma.recipe.findUnique({ where: { id } });
		let slug: string | undefined;
		if (originalRecipe && originalRecipe.title !== title) {
			slug = await generateUniqueSlug(title);
		}

		return await prisma.$transaction(async (tx) => {
			await tx.recipe.update({
				where: { id },
				data: {
					title,
					slug, // Se actualiza solo si se ha generado uno nuevo
					normalizedTitle: title.toLowerCase(),
					steps,
					imageUrl
				}
			});

			await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
			for (const ingredient of ingredients) {
				await tx.recipeIngredient.create({
					data: {
						recipeId: id,
						quantity: ingredient.quantity,
						productId: ingredient.type === 'product' ? ingredient.id : null,
						customIngredientId: ingredient.type === 'custom' ? ingredient.id : null
					}
				});
			}

			await tx.recipeUrl.deleteMany({ where: { recipeId: id } });
			if (urls && urls.length > 0) {
				await tx.recipeUrl.createMany({
					data: urls.map((url: string) => ({ recipeId: id, url }))
				});
			}

			return await tx.recipe.findUnique({ where: { id }, include: recipeInclude });
		});
	},

	async deleteById(id: string) {
		return await prisma.recipe.delete({
			where: { id }
		});
	},

	async findPaginated(searchTerm: string | null, limit: number, offset: number) {
		const normalizedSearchTerm = searchTerm?.toLowerCase();
		const whereClause: Prisma.RecipeWhereInput = normalizedSearchTerm
			? {
					OR: [
						{ normalizedTitle: { contains: normalizedSearchTerm } },
						{
							ingredients: {
								some: {
									OR: [
										{ product: { normalizedName: { contains: normalizedSearchTerm } } },
										{ customIngredient: { normalizedName: { contains: normalizedSearchTerm } } }
									]
								}
							}
						}
					]
				}
			: {};

		return prisma.recipe.findMany({
			where: whereClause,
			include: recipeInclude,
			orderBy: { title: 'asc' },
			take: limit,
			skip: offset
		});
	},

	async findAdvanced(filters: AdvancedSearchFilters): Promise<FullRecipe[]> {
		const { ingredients, grams, percent, sortBy, limit, offset } = filters;

		const withClause = Prisma.sql`
			WITH "RecipeTotals" AS (
				SELECT
					ri."recipeId",
					SUM(COALESCE(p.calories, ci.calories, 0) * ri.quantity / 100.0) AS "totalCalories",
					SUM(COALESCE(p.protein, ci.protein, 0) * ri.quantity / 100.0) AS "totalProtein",
					SUM(COALESCE(p.carbs, ci.carbs, 0) * ri.quantity / 100.0) AS "totalCarbs",
					SUM(COALESCE(p.fat, ci.fat, 0) * ri.quantity / 100.0) AS "totalFat"
				FROM "RecipeIngredient" ri
				LEFT JOIN "Product" p ON ri."productId" = p.id
				LEFT JOIN "CustomIngredient" ci ON ri."customIngredientId" = ci.id
				GROUP BY ri."recipeId"
			),
			"RecipePercentages" AS (
				SELECT
					"recipeId",
					"totalCalories",
					"totalProtein",
					"totalCarbs",
					"totalFat",
					"totalProtein" * 4 * 100.0 / NULLIF("totalCalories", 0) AS "percentProtein",
					"totalCarbs" * 4 * 100.0 / NULLIF("totalCalories", 0) AS "percentCarbs",
					"totalFat" * 9 * 100.0 / NULLIF("totalCalories", 0) AS "percentFat"
				FROM "RecipeTotals"
			)
		`;

		const selectClause = Prisma.sql`
			SELECT r.id, r.title, r.imageUrl
			FROM "Recipe" r
			JOIN "RecipePercentages" rt ON r.id = rt."recipeId"
		`;

		const whereConditions: Prisma.Sql[] = [];

		if (ingredients && ingredients.length > 0) {
			// Justificación: Se itera sobre cada ID de ingrediente para construir una
			// subconsulta `EXISTS`. Esto asegura que la receta contenga TODOS los
			// ingredientes seleccionados. La lógica se ha hecho robusta para
			// manejar IDs con o sin prefijo, infiriendo el tipo si este falta.
			ingredients.forEach((ingredientId) => {
				let isProduct = false;
				let id = ingredientId;

				if (id.startsWith('product-')) {
					isProduct = true;
					id = id.replace('product-', '');
				} else if (id.startsWith('custom-')) {
					id = id.replace('custom-', '');
				} else if (!isNaN(Number(id))) {
					// Si no hay prefijo pero es numérico, asumimos que es un producto (código de barras).
					isProduct = true;
				}
				// Si no tiene prefijo y no es numérico, se asume que es un CUID de un ingrediente custom.

				if (isProduct) {
					whereConditions.push(Prisma.sql`
						EXISTS (
							SELECT 1 FROM "RecipeIngredient" ri
							WHERE ri."recipeId" = r.id AND ri."productId" = ${id}
						)
					`);
				} else {
					whereConditions.push(Prisma.sql`
						EXISTS (
							SELECT 1 FROM "RecipeIngredient" ri
							WHERE ri."recipeId" = r.id AND ri."customIngredientId" = ${id}
						)
					`);
				}
			});
		}

		if (grams?.calories?.min != null) whereConditions.push(Prisma.sql`rt."totalCalories" >= ${grams.calories.min}`);
		if (grams?.calories?.max != null) whereConditions.push(Prisma.sql`rt."totalCalories" <= ${grams.calories.max}`);
		if (grams?.protein?.min != null) whereConditions.push(Prisma.sql`rt."totalProtein" >= ${grams.protein.min}`);
		if (grams?.protein?.max != null) whereConditions.push(Prisma.sql`rt."totalProtein" <= ${grams.protein.max}`);
		if (grams?.carbs?.min != null) whereConditions.push(Prisma.sql`rt."totalCarbs" >= ${grams.carbs.min}`);
		if (grams?.carbs?.max != null) whereConditions.push(Prisma.sql`rt."totalCarbs" <= ${grams.carbs.max}`);
		if (grams?.fat?.min != null) whereConditions.push(Prisma.sql`rt."totalFat" >= ${grams.fat.min}`);
		if (grams?.fat?.max != null) whereConditions.push(Prisma.sql`rt."totalFat" <= ${grams.fat.max}`);

		if (percent?.protein?.min != null) whereConditions.push(Prisma.sql`rt."percentProtein" >= ${percent.protein.min}`);
		if (percent?.protein?.max != null) whereConditions.push(Prisma.sql`rt."percentProtein" <= ${percent.protein.max}`);
		if (percent?.carbs?.min != null) whereConditions.push(Prisma.sql`rt."percentCarbs" >= ${percent.carbs.min}`);
		if (percent?.carbs?.max != null) whereConditions.push(Prisma.sql`rt."percentCarbs" <= ${percent.carbs.max}`);
		if (percent?.fat?.min != null) whereConditions.push(Prisma.sql`rt."percentFat" >= ${percent.fat.min}`);
		if (percent?.fat?.max != null) whereConditions.push(Prisma.sql`rt."percentFat" <= ${percent.fat.max}`);


		const whereClause = whereConditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}` : Prisma.empty;

		let orderByClause: Prisma.Sql;
		switch (sortBy) {
			case 'title_asc':
				orderByClause = Prisma.sql`ORDER BY r.title ASC`;
				break;
			case 'title_desc':
				orderByClause = Prisma.sql`ORDER BY r.title DESC`;
				break;
			case 'calories_asc':
				orderByClause = Prisma.sql`ORDER BY rt."totalCalories" ASC`;
				break;
			case 'calories_desc':
				orderByClause = Prisma.sql`ORDER BY rt."totalCalories" DESC`;
				break;
			case 'protein_grams_asc':
				orderByClause = Prisma.sql`ORDER BY rt."totalProtein" ASC`;
				break;
			case 'protein_grams_desc':
				orderByClause = Prisma.sql`ORDER BY rt."totalProtein" DESC`;
				break;
			case 'fat_grams_asc':
				orderByClause = Prisma.sql`ORDER BY rt."totalFat" ASC`;
				break;
			case 'fat_grams_desc':
				orderByClause = Prisma.sql`ORDER BY rt."totalFat" DESC`;
				break;
			case 'carbs_grams_asc':
				orderByClause = Prisma.sql`ORDER BY rt."totalCarbs" ASC`;
				break;
			case 'carbs_grams_desc':
				orderByClause = Prisma.sql`ORDER BY rt."totalCarbs" DESC`;
				break;
			case 'protein_percent_asc':
				orderByClause = Prisma.sql`ORDER BY rt."percentProtein" ASC`;
				break;
			case 'protein_percent_desc':
				orderByClause = Prisma.sql`ORDER BY rt."percentProtein" DESC`;
				break;
			case 'fat_percent_asc':
				orderByClause = Prisma.sql`ORDER BY rt."percentFat" ASC`;
				break;
			case 'fat_percent_desc':
				orderByClause = Prisma.sql`ORDER BY rt."percentFat" DESC`;
				break;
			case 'carbs_percent_asc':
				orderByClause = Prisma.sql`ORDER BY rt."percentCarbs" ASC`;
				break;
			case 'carbs_percent_desc':
				orderByClause = Prisma.sql`ORDER BY rt."percentCarbs" DESC`;
				break;
			default:
				orderByClause = Prisma.sql`ORDER BY r.title ASC`;
		}

		const paginationClause = Prisma.sql`LIMIT ${limit} OFFSET ${offset}`;

		const fullQuery = Prisma.sql`${withClause} ${selectClause} ${whereClause} ${orderByClause} ${paginationClause}`;

		const result = await prisma.$queryRaw<RawRecipeQueryResult[]>(fullQuery);
		const recipeIds = result.map((r) => r.id);

		if (recipeIds.length === 0) return [];

		const recipesInOrder = await prisma.recipe.findMany({
			where: { id: { in: recipeIds } },
			include: recipeInclude
		});

		return recipeIds.map(id => recipesInOrder.find(r => r.id === id)).filter((r): r is FullRecipe => !!r);
	}
};

// Ruta: src/lib/server/services/recipeService.ts
import prisma from '$lib/server/prisma';
import { Prisma } from '@prisma/client';
import type { RecipeData } from '$lib/schemas/recipeSchema';

const recipeInclude = {
	ingredients: {
		include: {
			product: true,
			customIngredient: true
		}
	},
	urls: true
};

// --- Tipos para Búsqueda Avanzada ---
export type MacroFilter = {
	min?: number;
	max?: number;
};

export type AdvancedSearchFilters = {
	ingredients?: string[];
	unit?: 'grams' | 'percent'; // La unidad es clave
	calories?: MacroFilter;
	protein?: MacroFilter;
	carbs?: MacroFilter;
	fat?: MacroFilter;
	sortBy?: string;
	limit: number;
	offset: number;
};

type RawRecipeQueryResult = {
	id: string;
	title: string;
	imageUrl: string | null;
};

export const recipeService = {
	async getAll() {
		return await prisma.recipe.findMany({
			include: recipeInclude,
			orderBy: { title: 'asc' }
		});
	},

	async getById(id: string) {
		return await prisma.recipe.findUnique({
			where: { id },
			include: recipeInclude
		});
	},

	async create(data: RecipeData) {
		const { title, description, steps, ingredients, urls, imageUrl } = data;

		return await prisma.$transaction(async (tx) => {
			const newRecipe = await tx.recipe.create({
				data: {
					title,
					normalizedTitle: title.toLowerCase(),
					description,
					steps,
					imageUrl,
					urls: {
						create: urls?.map((url: string) => ({ url }))
					}
				}
			});

			for (const ingredient of ingredients) {
				await tx.recipeIngredient.create({
					data: {
						recipeId: newRecipe.id,
						quantity: ingredient.quantity,
						productId: ingredient.type === 'product' ? ingredient.id : null,
						customIngredientId: ingredient.type === 'custom' ? ingredient.id : null
					}
				});
			}
			return newRecipe;
		});
	},

	async update(id: string, data: RecipeData) {
		const { title, description, steps, ingredients, urls, imageUrl } = data;

		return await prisma.$transaction(async (tx) => {
			await tx.recipe.update({
				where: { id },
				data: {
					title,
					normalizedTitle: title.toLowerCase(),
					description,
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

	async findAdvanced(filters: AdvancedSearchFilters) {
		const { ingredients, unit, calories, protein, carbs, fat, sortBy, limit, offset } = filters;

		// Justificación: La cláusula WITH ahora calcula tanto los totales en gramos como
		// los porcentajes de macronutrientes. Se usa NULLIF para evitar la división por cero.
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
			const productIds: string[] = [];
			const customIngredientIds: string[] = [];
			ingredients.forEach((id) => {
				if (id.startsWith('product-')) productIds.push(id.replace('product-', ''));
				else if (id.startsWith('custom-')) customIngredientIds.push(id.replace('custom-', ''));
			});

			const totalIngredientsToMatch = productIds.length + customIngredientIds.length;
			if (totalIngredientsToMatch > 0) {
				const ingredientConditions: Prisma.Sql[] = [];
				if (productIds.length > 0) {
					ingredientConditions.push(Prisma.sql`ri."productId" IN (${Prisma.join(productIds)})`);
				}
				if (customIngredientIds.length > 0) {
					ingredientConditions.push(Prisma.sql`ri."customIngredientId" IN (${Prisma.join(customIngredientIds)})`);
				}
				whereConditions.push(Prisma.sql`
					r.id IN (
						SELECT "recipeId" FROM "RecipeIngredient" ri
						WHERE ${Prisma.join(ingredientConditions, ' OR ')}
						GROUP BY "recipeId" HAVING COUNT(*) = ${totalIngredientsToMatch}
					)
				`);
			}
		}

		if (calories?.min != null) whereConditions.push(Prisma.sql`rt."totalCalories" >= ${calories.min}`);
		if (calories?.max != null) whereConditions.push(Prisma.sql`rt."totalCalories" <= ${calories.max}`);

		// Justificación: Se aplica el filtro de macros a las columnas de gramos o de porcentajes
		// basándose en el parámetro `unit` enviado desde el frontend.
		if (unit === 'percent') {
			if (protein?.min != null) whereConditions.push(Prisma.sql`rt."percentProtein" >= ${protein.min}`);
			if (protein?.max != null) whereConditions.push(Prisma.sql`rt."percentProtein" <= ${protein.max}`);
			if (carbs?.min != null) whereConditions.push(Prisma.sql`rt."percentCarbs" >= ${carbs.min}`);
			if (carbs?.max != null) whereConditions.push(Prisma.sql`rt."percentCarbs" <= ${carbs.max}`);
			if (fat?.min != null) whereConditions.push(Prisma.sql`rt."percentFat" >= ${fat.min}`);
			if (fat?.max != null) whereConditions.push(Prisma.sql`rt."percentFat" <= ${fat.max}`);
		} else { // 'grams' es el default
			if (protein?.min != null) whereConditions.push(Prisma.sql`rt."totalProtein" >= ${protein.min}`);
			if (protein?.max != null) whereConditions.push(Prisma.sql`rt."totalProtein" <= ${protein.max}`);
			if (carbs?.min != null) whereConditions.push(Prisma.sql`rt."totalCarbs" >= ${carbs.min}`);
			if (carbs?.max != null) whereConditions.push(Prisma.sql`rt."totalCarbs" <= ${carbs.max}`);
			if (fat?.min != null) whereConditions.push(Prisma.sql`rt."totalFat" >= ${fat.min}`);
			if (fat?.max != null) whereConditions.push(Prisma.sql`rt."totalFat" <= ${fat.max}`);
		}

		const whereClause = whereConditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}` : Prisma.empty;

		let orderByClause: Prisma.Sql;
		switch (sortBy) {
			case 'calories_asc': orderByClause = Prisma.sql`ORDER BY rt."totalCalories" ASC`; break;
			case 'calories_desc': orderByClause = Prisma.sql`ORDER BY rt."totalCalories" DESC`; break;
			case 'protein_desc':
				orderByClause = unit === 'percent'
					? Prisma.sql`ORDER BY rt."percentProtein" DESC`
					: Prisma.sql`ORDER BY rt."totalProtein" DESC`;
				break;
			default: orderByClause = Prisma.sql`ORDER BY r.title ASC`;
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

		// Reordena los resultados completos según el orden de la consulta paginada
		return recipeIds.map(id => recipesInOrder.find(r => r.id === id)).filter(Boolean) as any[];
	}
};
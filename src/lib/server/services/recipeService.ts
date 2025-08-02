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
		const { ingredients, calories, protein, carbs, fat, sortBy, limit, offset } = filters;

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
			)
		`;

		const selectClause = Prisma.sql`
			SELECT r.id, r.title, r.imageUrl
			FROM "Recipe" r
			JOIN "RecipeTotals" rt ON r.id = rt."recipeId"
		`;

		const whereConditions: Prisma.Sql[] = [];

		if (ingredients && ingredients.length > 0) {
			whereConditions.push(Prisma.sql`
				r.id IN (
					SELECT "recipeId"
					FROM "RecipeIngredient"
					WHERE "customIngredientId" IN (${Prisma.join(ingredients)})
					GROUP BY "recipeId"
					HAVING COUNT(DISTINCT "customIngredientId") = ${ingredients.length}
				)
			`);
		}

		// Justificación: Se comprueba explícitamente contra `null` y `undefined` para permitir
		// filtros con el valor `0`, que es un valor "falsy" en JavaScript.
		if (calories?.min != null) whereConditions.push(Prisma.sql`rt."totalCalories" >= ${calories.min}`);
		if (calories?.max != null) whereConditions.push(Prisma.sql`rt."totalCalories" <= ${calories.max}`);
		if (protein?.min != null) whereConditions.push(Prisma.sql`rt."totalProtein" >= ${protein.min}`);
		if (protein?.max != null) whereConditions.push(Prisma.sql`rt."totalProtein" <= ${protein.max}`);
		if (carbs?.min != null) whereConditions.push(Prisma.sql`rt."totalCarbs" >= ${carbs.min}`);
		if (carbs?.max != null) whereConditions.push(Prisma.sql`rt."totalCarbs" <= ${carbs.max}`);
		if (fat?.min != null) whereConditions.push(Prisma.sql`rt."totalFat" >= ${fat.min}`);
		if (fat?.max != null) whereConditions.push(Prisma.sql`rt."totalFat" <= ${fat.max}`);

		const whereClause =
			whereConditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}` : Prisma.empty;

		let orderByClause: Prisma.Sql;
		switch (sortBy) {
			case 'calories_asc':
				orderByClause = Prisma.sql`ORDER BY rt."totalCalories" ASC`;
				break;
			case 'calories_desc':
				orderByClause = Prisma.sql`ORDER BY rt."totalCalories" DESC`;
				break;
			case 'protein_desc':
				orderByClause = Prisma.sql`ORDER BY rt."totalProtein" DESC`;
				break;
			default:
				orderByClause = Prisma.sql`ORDER BY r.title ASC`;
		}

		const paginationClause = Prisma.sql`LIMIT ${limit} OFFSET ${offset}`;

		// --- INICIO DE CÓDIGO DE DEPURACIÓN ---
		console.log('[DEBUG] Filtros recibidos:', JSON.stringify(filters, null, 2));
		// --- FIN DE CÓDIGO DE DEPURACIÓN ---

		const fullQuery = Prisma.sql`
			${withClause}
			${selectClause}
			${whereClause}
			${orderByClause}
			${paginationClause}
		`;

		// --- INICIO DE CÓDIGO DE DEPURACIÓN ---
		console.log('[DEBUG] Consulta SQL generada:', fullQuery);
		// --- FIN DE CÓDIGO DE DEPURACIÓN ---

		const result = await prisma.$queryRaw<RawRecipeQueryResult[]>(fullQuery);

		const recipeIds = result.map((r) => r.id);
		if (recipeIds.length === 0) return [];

		const recipesInOrder = await prisma.recipe.findMany({
			where: { id: { in: recipeIds } },
			include: recipeInclude
		});

		return recipeIds.map(id => recipesInOrder.find(r => r.id === id)).filter(Boolean);
	}
};

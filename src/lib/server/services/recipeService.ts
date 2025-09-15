			// Ruta: src/lib/server/services/recipeService.ts
import prisma from '$lib/server/prisma';
import { Prisma } from '@prisma/client';
import type { SearchFilters as ZodSearchFilters } from '$lib/schemas/searchSchema';
import type { RecipeData } from '$lib/schemas/recipeSchema';
import { recipeInclude, type FullRecipe } from '$lib/models/recipe';
import { generateUniqueSlug } from '$lib/server/slug';
import { normalizeText } from '$lib/utils';
import { imageService } from './imageService';

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
		const { title, steps, ingredients, urls, imageUrl: rawImageUrl } = data;
		const slug = await generateUniqueSlug(title);

		let finalImageUrl: string | null = null;
		if (rawImageUrl) {
			finalImageUrl = await imageService.saveBase64ImageAsFile(rawImageUrl, slug);
		}

		return await prisma.$transaction(async (tx) => {
			const ingredientData = await Promise.all(
				ingredients.map(async (ingredient) => {
					let productId: string;

					if (ingredient.source === 'local') {
						// El producto ya existe, usamos su CUID directamente.
						productId = ingredient.id;
					} else {
						// Es un producto de OFF, puede que no exista en nuestra BD.
						// Lo buscamos por su código de barras.
						const existingProduct = await tx.product.findUnique({
							where: { barcode: ingredient.id }
						});

						if (existingProduct) {
							// El producto ya estaba en la BD, usamos su ID.
							productId = existingProduct.id;
						} else {
							// El producto no existe, lo creamos.
							const newProduct = await tx.product.create({
								data: {
									barcode: ingredient.id,
									name: ingredient.name,
									normalizedName: normalizeText(ingredient.name),
									calories: ingredient.calories,
									protein: ingredient.protein,
									carbs: ingredient.carbs,
									fat: ingredient.fat,
									imageUrl: ingredient.imageUrl
								}
							});
							productId = newProduct.id;
						}
					}

					return {
						quantity: ingredient.quantity,
						productId: productId
					};
				})
			);

			const createdRecipe = await tx.recipe.create({
				data: {
					title,
					slug,
					normalizedTitle: normalizeText(title),
					steps,
					imageUrl: finalImageUrl,
					urls: {
						create: urls?.map((url: string) => ({ url }))
					},
					ingredients: {
						create: ingredientData
					}
				},
				include: recipeInclude
			});

			if (!createdRecipe) {
				throw new Error('No se pudo encontrar la receta recién creada.');
			}
			return createdRecipe;
		});
	},

	async update(id: string, data: RecipeData) {
		const { title, steps, ingredients, urls, imageUrl: newImageUrl } = data;

		const originalRecipe = await prisma.recipe.findUnique({ where: { id } });
		if (!originalRecipe) {
			throw new Error('Receta no encontrada');
		}

		let slug = originalRecipe.slug;
		if (originalRecipe.title !== title) {
			slug = await generateUniqueSlug(title);
		}

		let finalImageUrl = originalRecipe.imageUrl;
		if (newImageUrl && newImageUrl !== originalRecipe.imageUrl) {
			// Borramos la imagen antigua si existe y es diferente
			await imageService.deleteImageFile(originalRecipe.imageUrl);
			// Guardamos la nueva imagen
			finalImageUrl = await imageService.saveBase64ImageAsFile(newImageUrl, slug);
		}

		return await prisma.$transaction(async (tx) => {
			// 1. Resolver los IDs de producto para los ingredientes.
			// Esta lógica es idéntica a la de `create` y asegura que los productos
			// nuevos de OFF se creen antes de asociarlos a la receta.
			const ingredientData = await Promise.all(
				ingredients.map(async (ingredient) => {
					let productId: string;
					if (ingredient.source === 'local') {
						productId = ingredient.id;
					} else {
						const existingProduct = await tx.product.findUnique({
							where: { barcode: ingredient.id }
						});
						if (existingProduct) {
							productId = existingProduct.id;
						} else {
							const newProduct = await tx.product.create({
								data: {
									barcode: ingredient.id,
									name: ingredient.name,
									normalizedName: normalizeText(ingredient.name),
									calories: ingredient.calories,
									protein: ingredient.protein,
									carbs: ingredient.carbs,
									fat: ingredient.fat,
									imageUrl: ingredient.imageUrl
								}
							});
							productId = newProduct.id;
						}
					}
					return {
						quantity: ingredient.quantity,
						productId: productId
					};
				})
			);

			// 2. Actualizar los datos básicos de la receta.
			await tx.recipe.update({
				where: { id },
				data: {
					title,
					slug,
					normalizedTitle: normalizeText(title),
					steps,
					imageUrl: finalImageUrl
				}
			});

			// 3. Sincronizar los ingredientes: borrar los antiguos y crear los nuevos.
			await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
			await tx.recipeIngredient.createMany({
				data: ingredientData.map((ing) => ({
					recipeId: id,
					...ing
				}))
			});

			// 4. Sincronizar las URLs: borrar las antiguas y crear las nuevas.
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
		const recipe = await prisma.recipe.findUnique({
			where: { id },
			select: { imageUrl: true }
		});

		if (recipe?.imageUrl) {
			await imageService.deleteImageFile(recipe.imageUrl);
		}

		return await prisma.recipe.delete({
			where: { id }
		});
	},

	async findPaginated(searchTerm: string | null, limit: number, offset: number) {
		/*
		 * NOTA: Se refactoriza la consulta para evitar duplicados.
		 * La lógica anterior era una única consulta con un OR, que podía devolver duplicados
		 * si una receta coincidía tanto por título como por ingrediente.
		 */

		const normalizedSearchTerm = searchTerm ? normalizeText(searchTerm) : undefined;
		if (!normalizedSearchTerm) {
			return prisma.recipe.findMany({
				include: recipeInclude,
				orderBy: { updatedAt: 'desc' },
				take: limit,
				skip: offset
			});
		}

		// 1. Encontrar IDs que coincidan por título
		const recipesByTitle = await prisma.recipe.findMany({
			where: { normalizedTitle: { contains: normalizedSearchTerm } },
			select: { id: true }
		});

		// 2. Encontrar IDs que coincidan por ingrediente
		const recipesByIngredient = await prisma.recipe.findMany({
			where: {
				ingredients: {
					some: {
						product: { normalizedName: { contains: normalizedSearchTerm } }
					}
				}
			},
			select: { id: true }
		});

		// 3. Combinar y obtener IDs únicos
		const allIds = [...recipesByTitle.map((r) => r.id), ...recipesByIngredient.map((r) => r.id)];
		const uniqueIds = [...new Set(allIds)];

		// 4. Obtener las recetas completas para los IDs únicos con paginación
		const recipes = await prisma.recipe.findMany({
			where: { id: { in: uniqueIds } },
			include: recipeInclude,
			orderBy: { updatedAt: 'desc' },
			take: limit,
			skip: offset
		});

		// WORKAROUND: Forzar la unicidad en JS para mitigar un posible bug de Prisma
		// que devuelve duplicados incluso cuando se consulta por IDs únicos.
		return Array.from(new Map(recipes.map((r) => [r.id, r])).values());
	},

	async findAdvanced(filters: AdvancedSearchFilters): Promise<FullRecipe[]> {
		const { ingredients, grams, percent, sortBy, limit, offset } = filters;

		const withClause = Prisma.sql`
			WITH "RecipeTotals" AS (
				SELECT
					ri."recipeId",
					SUM(p.calories * ri.quantity / 100.0) AS "totalCalories",
					SUM(p.protein * ri.quantity / 100.0) AS "totalProtein",
					SUM(p.carbs * ri.quantity / 100.0) AS "totalCarbs",
					SUM(p.fat * ri.quantity / 100.0) AS "totalFat"
				FROM "RecipeIngredient" ri
				JOIN "Product" p ON ri."productId" = p.id
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
			SELECT r.id, r.title, r."imageUrl"
			FROM "Recipe" r
			JOIN "RecipePercentages" rt ON r.id = rt."recipeId"
		`;

		const whereConditions: Prisma.Sql[] = [];

		if (ingredients && ingredients.length > 0) {
			ingredients.forEach((ingredientId) => {
				whereConditions.push(Prisma.sql`
						EXISTS (
							SELECT 1 FROM "RecipeIngredient" ri
							WHERE ri."recipeId" = r.id AND ri."productId" = ${ingredientId}
						)
					`);
			});
		}

		if (grams?.calories?.min != null)
			whereConditions.push(Prisma.sql`rt."totalCalories" >= ${grams.calories.min}`);
		if (grams?.calories?.max != null)
			whereConditions.push(Prisma.sql`rt."totalCalories" <= ${grams.calories.max}`);
		if (grams?.protein?.min != null)
			whereConditions.push(Prisma.sql`rt."totalProtein" >= ${grams.protein.min}`);
		if (grams?.protein?.max != null)
			whereConditions.push(Prisma.sql`rt."totalProtein" <= ${grams.protein.max}`);
		if (grams?.carbs?.min != null)
			whereConditions.push(Prisma.sql`rt."totalCarbs" >= ${grams.carbs.min}`);
		if (grams?.carbs?.max != null)
			whereConditions.push(Prisma.sql`rt."totalCarbs" <= ${grams.carbs.max}`);
		if (grams?.fat?.min != null) whereConditions.push(Prisma.sql`rt."totalFat" >= ${grams.fat.min}`);
		if (grams?.fat?.max != null)
			whereConditions.push(Prisma.sql`rt."totalFat" <= ${grams.fat.max}`);

		if (percent?.protein?.min != null)
			whereConditions.push(Prisma.sql`rt."percentProtein" >= ${percent.protein.min}`);
		if (percent?.protein?.max != null)
			whereConditions.push(Prisma.sql`rt."percentProtein" <= ${percent.protein.max}`);
		if (percent?.carbs?.min != null)
			whereConditions.push(Prisma.sql`rt."percentCarbs" >= ${percent.carbs.min}`);
		if (percent?.carbs?.max != null)
			whereConditions.push(Prisma.sql`rt."percentCarbs" <= ${percent.carbs.max}`);
		if (percent?.fat?.min != null)
			whereConditions.push(Prisma.sql`rt."percentFat" >= ${percent.fat.min}`);
		if (percent?.fat?.max != null)
			whereConditions.push(Prisma.sql`rt."percentFat" <= ${percent.fat.max}`);

		const whereClause =
			whereConditions.length > 0
				? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`
				: Prisma.empty;

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

		return recipeIds
			.map((id) => recipesInOrder.find((r) => r.id === id))
			.filter((r): r is FullRecipe => !!r);
	}
};
import { browser } from '$app/environment';
import type { CalculableProduct } from '$lib/recipeCalculator';

// --- Tipos ---
type IngredientWithDetails = CalculableProduct & {
	id: string;
	name: string;
	source: 'local' | 'off';
	imageUrl?: string | null;
};

export type RecipeStep = { id: string; text: string };

type InitialData = {
	title: string;
	steps: string[] | string;
	imageUrl: string | null;
	urls: { url: string }[];
	ingredients: {
		quantity: number;
		product: (Omit<CalculableProduct, 'quantity'> & {
			id: string;
			name: string;
			imageUrl: string | null;
		}) | null;
	}[];
};

export type FormState = {
	title: string;
	steps: RecipeStep[];
	imageUrl: string | null;
	urls: string[];
	ingredients: IngredientWithDetails[];
};

// --- Funciones de ayuda para la inicialización ---
const getRecipeSteps = (stepsData: unknown): RecipeStep[] => {
	let stepsArray: string[] = [];
	if (Array.isArray(stepsData)) {
		stepsArray = stepsData.map(String);
	} else if (browser && typeof stepsData === 'string') {
		try {
			const parsed = JSON.parse(stepsData);
			stepsArray = Array.isArray(parsed) ? parsed.map(String) : [String(stepsData)];
		} catch {
			stepsArray = [String(stepsData)];
		}
	} else if (stepsArray.length === 0) {
		stepsArray = [''];
	}
	return stepsArray.map((text) => ({ id: crypto.randomUUID(), text }));
};

const mapInitialIngredients = (ingredientsData: InitialData['ingredients'] | undefined) => {
	if (!ingredientsData) return [];
	return ingredientsData
		.map((ing): IngredientWithDetails | null => {
			const product = ing.product;
			if (!product) return null;

			return {
				...product,
				id: product.id,
				quantity: ing.quantity,
				source: 'local'
			};
		})
		.filter((ing): ing is IngredientWithDetails => ing !== null);
};

// --- Modelo de Estado ---
export function createRecipeState(initialData: InitialData | null) {
	const state: FormState = $state({
		title: initialData?.title ?? '',
		steps: getRecipeSteps(initialData?.steps ?? ['']),
		imageUrl: initialData?.imageUrl ?? null,
		urls: initialData?.urls?.map((u) => u.url) ?? [],
		ingredients: mapInitialIngredients(initialData?.ingredients)
	});

	// --- Métodos de Mutación ---
	function addStep() {
		state.steps.push({ id: crypto.randomUUID(), text: '' });
	}

	function removeStep(id: string) {
		state.steps = state.steps.filter((step) => step.id !== id);
	}

	function updateStepText(id: string, text: string) {
		const step = state.steps.find((s) => s.id === id);
		if (step) {
			step.text = text;
		}
	}

	return {
		get state() {
			return state;
		},
		addStep,
		removeStep,
		updateStepText,

		get initialFormState(): FormState {
			return {
				title: initialData?.title ?? '',
				steps: getRecipeSteps(initialData?.steps),
				imageUrl: initialData?.imageUrl ?? null,
				urls: initialData?.urls?.map((u) => u.url) ?? [],
				ingredients: mapInitialIngredients(initialData?.ingredients)
			};
		}
	};
}

// Fichero: src/lib/components/recipes/EditQuantitiesDialog.spec.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, within, cleanup } from '@testing-library/svelte';
import EditQuantitiesDialog from './EditQuantitiesDialog.svelte';

const mockRecipe = {
	id: 'recipe-1',
	title: 'Pollo con Arroz',
	ingredients: [
		{
			quantity: 200,
			product: {
				id: 'product-1',
				name: 'Pechuga de Pollo',
				calories: 165,
				protein: 31,
				fat: 3.6,
				carbs: 0
			},
			customIngredient: null
		},
		{
			quantity: 150,
			product: null,
			customIngredient: {
				id: 'custom-1',
				name: 'Arroz Blanco',
				calories: 130,
				protein: 2.7,
				fat: 0.3,
				carbs: 28
			}
		}
	]
};

describe('EditQuantitiesDialog.svelte', () => {
	// Justificación: Se llama a `cleanup` después de cada test para desmontar
	// el componente y asegurar que el DOM esté limpio para la siguiente prueba.
	// Esto previene errores de "elementos múltiples encontrados".
	afterEach(() => cleanup());

	it('should render initial data and original totals correctly', async () => {
		render(EditQuantitiesDialog, {
			props: {
				recipe: mockRecipe,
				open: true,
				onOpenChange: () => {}
			}
		});

		expect(screen.getByText('Editar Cantidades: Pollo con Arroz')).toBeTruthy();

		const comparisonSection = screen.getByTestId('comparison-section');
		const initialCalories = within(comparisonSection).getAllByText(/Calorías: 525 kcal/i);
		expect(initialCalories).toHaveLength(2);
	});

	it('should recalculate totals in real-time when an ingredient quantity changes', async () => {
		render(EditQuantitiesDialog, {
			props: {
				recipe: mockRecipe,
				open: true,
				onOpenChange: () => {}
			}
		});

		const polloInput = screen.getByLabelText('Pechuga de Pollo');
		await fireEvent.input(polloInput, { target: { value: '100' } });

		const comparisonSection = screen.getByTestId('comparison-section');
		const originalCalories = within(comparisonSection).getByText(/Calorías: 525 kcal/i);
		const recalculatedCalories = within(comparisonSection).getByText(/Calorías: 360 kcal/i);

		expect(originalCalories).toBeTruthy();
		expect(recalculatedCalories).toBeTruthy();
	});

	it('should call onOpenChange with false when the close button is clicked', async () => {
		const onOpenChangeMock = vi.fn();
		render(EditQuantitiesDialog, {
			props: {
				recipe: mockRecipe,
				open: true,
				onOpenChange: onOpenChangeMock
			}
		});

		const closeButton = screen.getByTestId('dialog-close-button');
		await fireEvent.click(closeButton);

		expect(onOpenChangeMock).toHaveBeenCalledWith(false);
		expect(onOpenChangeMock).toHaveBeenCalledOnce();
	});
});

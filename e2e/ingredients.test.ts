// Ruta: e2e/ingredients.test.ts
import { test, expect } from '@playwright/test';

// Justificación: Este test E2E valida el flujo completo de creación de un ingrediente,
// asegurando que la UI (diálogo modal), las form actions y la API funcionan en conjunto.

test.describe('Gestión de Ingredientes Personalizados', () => {
	test('debería permitir a un usuario crear, ver, editar y eliminar un ingrediente', async ({ page }) => {
		const ingredientName = `Tofu Test ${Date.now()}`;
		// --- LOGIN --- (Pre-condición para acceder a la página de admin)
		await page.goto('/login');
		await page.locator('input[name="user"]').fill('admin');
		await page.locator('input[name="password"]').fill('9457531t'); // Usar la contraseña de test
		await page.locator('button[type="submit"]').click();

		// Justificación (waitForURL): Esta es la forma más robusta de manejar redirecciones.
		// El test esperará explícitamente a que la navegación a la nueva página se complete
		// antes de intentar interactuar con ella. Esto resuelve la "race condition" final.
		await page.waitForURL('/admin/ingredientes');

		// Ahora que la navegación ha terminado, podemos verificar el estado final.
		await expect(page.locator('h1', { hasText: 'Gestión de Ingredientes Personalizados' })).toBeVisible();

		// Justificación (esperar por tbody): Esperamos a que el cuerpo de la tabla sea visible.
		// Esto actúa como un punto de sincronización robusto, asegurando que la función `load`
		// ha terminado y SvelteKit ha hidratado la página antes de intentar interactuar con ella.
		await expect(page.locator('table > tbody')).toBeVisible();

		// Justificación (expect.toPass): Esta es la solución definitiva para las "race conditions"
		// sutiles. Le dice a Playwright que reintente todo el bloque (hacer clic Y esperar el diálogo)
		// hasta que tenga éxito. Esto maneja el caso en que el clic ocurre milisegundos antes
		// de que el manejador de eventos de Svelte esté completamente listo.
		await expect(async () => {
			await page.getByRole('button', { name: 'Añadir Ingrediente' }).click();
			await expect(page.getByRole('heading', { name: 'Añadir Nuevo Ingrediente' })).toBeVisible();
			const createDialog = page.locator('[data-slot="dialog-content"]');
			await createDialog.locator('#name').fill(ingredientName);
			await createDialog.locator('#calories').fill('145');
			await createDialog.locator('#protein').fill('16');
			await createDialog.locator('#fat').fill('9');
			await createDialog.locator('#carbs').fill('2.5');
		}).toPass();

		// Guardar
		const createDialog = page.locator('[data-slot="dialog-content"]');
		await createDialog.getByRole('button', { name: 'Guardar Ingrediente' }).click();

		// Verificación: El diálogo se cierra y el nuevo ingrediente aparece en la tabla
		await expect(page.getByRole('cell', { name: ingredientName })).toBeVisible();
		await expect(createDialog).not.toBeVisible(); // El diálogo está cerrado

		// --- EDICIÓN ---
		const updatedIngredientName = `${ingredientName} (Editado)`;
		// Encontrar la fila que contiene el ingrediente y hacer clic en su botón de editar
		const row = page.locator('tr', { hasText: ingredientName });

		await expect(async () => {
			await row.getByRole('button', { name: 'Editar' }).click();
			await expect(page.getByRole('heading', { name: 'Editar Ingrediente' })).toBeVisible();
		}).toPass();

		// Editar el nombre en el diálogo
		const editDialog = page.locator('[data-slot="dialog-content"]');
		await editDialog.locator('#name-edit').fill(updatedIngredientName);
		await editDialog.getByRole('button', { name: 'Guardar Cambios' }).click();

		// Verificación: El nombre actualizado es visible y el antiguo ha desaparecido.
		await expect(page.getByRole('cell', { name: updatedIngredientName })).toBeVisible();
		await expect(page.getByRole('cell', { name: ingredientName, exact: true })).toHaveCount(0);

		// --- ELIMINACIÓN ---
		const finalRow = page.locator('tr', { hasText: updatedIngredientName });

		await expect(async () => {
			await finalRow.getByRole('button', { name: 'Eliminar' }).click();
			await expect(page.getByRole('heading', { name: 'Confirmar Eliminación' })).toBeVisible();
		}).toPass();

		// Confirmar en el diálogo de eliminación
		const deleteDialog = page.locator('[data-slot="dialog-content"]');
		await deleteDialog.getByRole('button', { name: 'Eliminar' }).click();

		// Verificación: La fila con el ingrediente ya no existe
		await expect(page.getByRole('cell', { name: updatedIngredientName })).not.toBeVisible();
	});
});
// Ruta: e2e/auth.test.ts
import { test, expect } from '@playwright/test';

// Justificación: Un test End-to-End (E2E) valida que todo el flujo (UI, API, lógica de sesión)
// funciona correctamente en conjunto, simulando una interacción real del usuario.
// Esto es crucial para garantizar la fiabilidad de la funcionalidad de login.

test.describe('Flujo de Autenticación', () => {
	test('debería mostrar un error con credenciales inválidas', async ({ page }) => {
		// 1. Navegar a la página de login
		await page.goto('/login');

		// 2. Rellenar el formulario con datos incorrectos
		await page.locator('input[name="user"]').fill('usuario-incorrecto');
		await page.locator('input[name="password"]').fill('password-incorrecto');

		// 3. Enviar el formulario
		await page.locator('button[type="submit"]').click();

		// 4. Verificar que se muestra un mensaje de error
		const errorMessage = page.locator('p.text-destructive');
		await expect(errorMessage).toBeVisible();
		await expect(errorMessage).toHaveText('Credenciales inválidas');

		// 5. Verificar que la URL no ha cambiado
		await expect(page).toHaveURL('/login');
	});

	test('debería redirigir al panel de admin con credenciales válidas', async ({ page }) => {
		// Pre-condición: Se asume que las variables de entorno para el test
		// están configuradas correctamente para que el login 'admin'/'admin' sea válido.
		// En un entorno real, esto se gestionaría con un .env.test

		// 1. Navegar a la página de login
		await page.goto('/login');

		// 2. Rellenar el formulario con datos correctos
		// NOTA: Playwright no tiene acceso a process.env del servidor.
		// Estos valores deben coincidir con los que el servidor de test espera.
		// Asumimos 'admin' como usuario y una contraseña que debe hashearse y ponerse en .env
		await page.locator('input[name="user"]').fill('admin');
		await page.locator('input[name="password"]').fill('9457531t'); // Reemplazar con la contraseña real de test

		// 3. Enviar el formulario
		await page.locator('button[type="submit"]').click();

		// 4. Verificar que se redirige a la página de admin
		// Usamos waitForURL para dar tiempo a que la redirección ocurra.
		await page.waitForURL('/admin');
		await expect(page).toHaveURL('/admin');

		// 5. (Opcional) Verificar que la cookie de sesión se ha establecido
		const cookies = await page.context().cookies();
		const sessionCookie = cookies.find((c) => c.name === 'session');
		expect(sessionCookie).toBeDefined();
		expect(sessionCookie?.httpOnly).toBe(true);
	});
});

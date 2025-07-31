// Ruta: e2e/auth.test.ts
import { test, expect } from '@playwright/test';

// Justificación: Un test End-to-End (E2E) valida que todo el flujo (UI, API, lógica de sesión)
// funciona correctamente en conjunto, simulando una interacción real del usuario.
// Esto es crucial para garantizar la fiabilidad de la funcionalidad de login.

test('Flujo de Autenticación: debería mostrar un error con credenciales inválidas', async ({
	page
}) => {
	// 1. Navegar a la página de login
	await page.goto('/login');

	// 2. Rellenar el formulario con datos incorrectos
	await page.locator('input[name="user"]').fill('usuario-incorrecto');
	await page.locator('input[name="password"]').fill('password-incorrecto');

	// 3. Enviar el formulario
	await page.locator('button[type="submit"]').click();

	// 4. Verificar que se muestra un mensaje de error
	// Justificación (expect.toHaveText): La `action` de SvelteKit ahora pobla el `form`
	// con el mensaje de error. La aserción web-first esperará a que el párrafo
	// aparezca y contenga el texto correcto.
	const errorMessage = page.locator('p.text-destructive');
	await expect(errorMessage).toHaveText('Credenciales inválidas');

	// 5. Verificar que la URL no ha cambiado
		// Justificación (RegExp en toHaveURL): Cuando una `form action` falla, SvelteKit
	// recarga la página y puede añadir parámetros a la URL (ej. `?/login`).
	// Usar una expresión regular hace la comprobación más robusta al verificar
	// que la ruta base sigue siendo /login, ignorando los parámetros.
	await expect(page).toHaveURL(/\/login/);
});

test('Flujo de Autenticación: debería redirigir al panel de admin con credenciales válidas', async ({
	page
}) => {
	// Pre-condición: Se asume que las variables de entorno para el test
	// están configuradas correctamente para que el login 'admin'/'admin' sea válido.
	// En un entorno real, esto se gestionaría con un .env.test

	// 1. Navegar a la página de login
	await page.goto('/login');

	// 2. Rellenar el formulario con datos correctos
	await page.locator('input[name="user"]').fill('admin');
	await page.locator('input[name="password"]').fill('9457531t'); // Reemplazar con la contraseña real de test

	// 3. Enviar el formulario
	await page.locator('button[type="submit"]').click();

	// 4. Verificar que se redirige a la página de admin
	// Justificación (expect.toBeVisible): En lugar de esperar por el texto, que puede cambiar,
	// esperamos a que un elemento único y fiable de la página de destino sea visible.
	// El `h1` con el texto específico es un buen candidato.
	await expect(page.locator('h1', { hasText: 'Gestión de Ingredientes Personalizados' })).toBeVisible();
	await expect(page).toHaveURL('/admin/ingredientes');

	// 5. (Opcional) Verificar que la cookie de sesión se ha establecido
	const cookies = await page.context().cookies();
	const sessionCookie = cookies.find((c) => c.name === 'session');
	expect(sessionCookie).toBeDefined();
	expect(sessionCookie?.httpOnly).toBe(true);
});
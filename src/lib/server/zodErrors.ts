// Ruta: src/lib/server/zodErrors.ts
import type { ZodError } from 'zod';

/**
 * Crea una respuesta de fallo estandarizada para las acciones de formulario de SvelteKit.
 * Garantiza que el objeto devuelto siempre tenga la misma estructura.
 *
 * @param message - El mensaje de error general que se mostrará al usuario.
 * @param error - (Opcional) Un error de Zod. Si se proporciona, se formateará
 *                y se añadirá al campo `errors`.
 * @returns Un objeto consistente para ser usado con `fail()`.
 */
export function createFailResponse(message: string, error?: ZodError) {
	const response: { message: string; errors: Record<string, string | undefined> } = {
		message,
		errors: {}
	};

	if (error) {
		for (const issue of error.issues) {
			if (issue.path.length > 0) {
				const field = issue.path.join('.');
				if (!response.errors[field]) {
					response.errors[field] = issue.message;
				}
			}
		}
	}

	return response;
}
// Ruta: src/lib/server/zodErrors.ts
import type { ZodError } from 'zod';

/**
 * Transforma un error de Zod en un objeto más simple,
 * mapeando los mensajes de error a cada campo que falló la validación.
 * @param error - El error de Zod.
 * @returns Un objeto donde cada clave es un campo y el valor es el primer mensaje de error para ese campo.
 */
export function formatZodError(error: ZodError) {
	const fieldErrors: Record<string, string | undefined> = {};
	for (const issue of error.issues) {
		if (issue.path.length > 0) {
			const field = issue.path.join('.');
			if (!fieldErrors[field]) {
				fieldErrors[field] = issue.message;
			}
		}
	}
	return {
		message: 'Validation failed',
		errors: fieldErrors
	};
}

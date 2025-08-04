// Ruta: src/routes/api/products/[id]/+server.ts
import { ingredientService } from '$lib/server/services/ingredientService';
import { json } from '@sveltejs/kit';
import { z } from 'zod';

const updateNameSchema = z.object({
	name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.')
});

export async function PATCH({ params, request }) {
	const { id } = params;

	if (!id) {
		return json({ error: 'ID de producto no proporcionado.' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const validation = updateNameSchema.safeParse(body);

		if (!validation.success) {
			return json({ error: validation.error.flatten() }, { status: 400 });
		}

		const { name } = validation.data;

		const updatedProduct = await ingredientService.updateProductName(id, name);

		return json(updatedProduct);
	} catch (error) {
		console.error(`[API] Error al actualizar el nombre del producto ${id}:`, error);
		// Comprobar si el error es de Prisma (ej. producto no encontrado)
		if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
			return json({ error: 'Producto no encontrado.' }, { status: 404 });
		}
		return json({ error: 'Error interno del servidor.' }, { status: 500 });
	}
}
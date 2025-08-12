// Ruta: src/lib/server/slug.ts
import slugify from 'slugify';
import prisma from '$lib/server/prisma';

/**
* Genera un slug único para una receta a partir de su título.
* Si el slug inicial ya existe, le añade un sufijo numérico incremental.
* @param {string} title - El título de la receta.
* @returns {Promise<string>} Un slug único garantizado.
*/
export async function generateUniqueSlug(title: string): Promise<string> {
	const baseSlug = slugify(title, { lower: true, strict: true });
	let uniqueSlug = baseSlug;
	let counter = 2;
	
	// Hacemos un bucle para encontrar un slug que no exista en la base de datos.
	// Esto previene errores de constraint 'unique' al insertar.
	while (await prisma.recipe.findUnique({ where: { slug: uniqueSlug } })) {
		uniqueSlug = `${baseSlug}-${counter}`;
		counter++;
	}
	
	return uniqueSlug;
}

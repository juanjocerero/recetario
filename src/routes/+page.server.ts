import type { PageServerLoad, Actions } from './$types';
import { recipeService } from '$lib/server/services/recipeService';
import { fail } from '@sveltejs/kit';

// Fichero: src/routes/+page.server.ts
// Este fichero se encarga de la lógica del lado del servidor para la página principal.

/**
 * Función `load` de SvelteKit.
 * Se ejecuta antes de que la página se renderice, tanto en la carga inicial
 * como en las navegaciones del lado del cliente. Su objetivo es proporcionar
 * los datos necesarios al componente de la página.
 */
export const load: PageServerLoad = async () => {
	// Justificación: Llamamos a `recipeService.getAll` para obtener todas las recetas.
	// Este servicio está diseñado para devolver no solo las recetas, sino también
	// todas sus relaciones anidadas (ingredientes y los detalles nutricionales de cada uno).
	// Esta carga de datos completa es fundamental para habilitar el cálculo
	// dinámico de nutrientes en el cliente sin necesidad de llamadas adicionales a la API.
	const recipes = await recipeService.getAll();

	// Devolvemos las recetas para que estén disponibles en el objeto `data`
	// del componente `+page.svelte`.
	return {
		recipes
	};
};

/**
 * Acciones del servidor para la página de recetas.
 * SvelteKit utiliza este objeto para gestionar las acciones de los formularios.
 */
export const actions: Actions = {
	/**
	 * Acción `delete`: Gestiona la eliminación de una receta.
	 * Se activa mediante un formulario que envía un POST a `?/delete`.
	 */
	delete: async ({ request }) => {
		// Obtenemos los datos del formulario.
		const data = await request.formData();
		const id = data.get('id');

		// Verificación: Nos aseguramos de que el ID es un string y no es nulo.
		if (typeof id !== 'string' || !id) {
			return fail(400, { message: 'ID de receta no válido' });
		}

		try {
			// Justificación: Llamamos a `recipeService.deleteById` para eliminar la receta.
			// Este método encapsula la lógica de borrado en la base de datos,
			// asegurando que la operación se realiza de forma segura y consistente.
			await recipeService.deleteById(id);

			// Devolvemos un estado de éxito.
			return {
				status: 200,
				message: 'Receta eliminada correctamente'
			};
		} catch (error) {
			// En caso de error en el servicio, lo capturamos y devolvemos un
			// estado de fallo con un mensaje apropiado.
			console.error('Error al eliminar la receta:', error);
			return fail(500, {
				message: 'No se pudo eliminar la receta. Por favor, inténtelo de nuevo.'
			});
		}
	}
};

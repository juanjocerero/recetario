<!-- Ruta: src/routes/recetas/[slug]/editar/+page.svelte -->
<script lang="ts">
	import RecipeForm from '$lib/components/recipes/RecipeForm.svelte';
	import type { PageData, ActionData } from './$types';
	import { goto } from '$app/navigation';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	async function handleSuccess() {
		await goto(`/recetas/${data.recipe.slug}`);
	}
</script>

<RecipeForm
	initialData={data.recipe}
	recipeId={data.recipe.id}
	{form}
	cardTitle="Editar Receta"
	submitButtonText="Guardar Cambios"
	onSuccess={handleSuccess}
/>
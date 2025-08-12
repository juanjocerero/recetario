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

<div class="container mx-auto p-4 md:px-24 mt-16 md:mt-0">
	<RecipeForm
	recipeId={data.recipe.id}
	initialData={data.recipe}
	{form}
	cardTitle="Editar Receta"
	submitButtonText="Actualizar Receta"
	onSuccess={handleSuccess}
	/>
</div>
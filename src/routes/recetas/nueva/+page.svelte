<!-- Ruta: src/routes/recetas/nueva/+page.svelte -->
<script lang="ts">
	import RecipeForm from '$lib/components/recipes/RecipeForm.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="container mx-auto p-4 md:px-24">
	<RecipeForm {form} />
</div>

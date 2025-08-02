<!-- Ruta: src/routes/login/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	export let form: ActionData;

	let loading = false;
</script>

<div class="flex min-h-screen items-center justify-center bg-muted/40">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="space-y-1 text-center">
			<Card.Title class="text-2xl font-bold">Admin Login</Card.Title>
			<Card.Description>Introduce tus credenciales para acceder al panel</Card.Description>
		</Card.Header>
		<Card.Content>
			<!-- Justificación (form action y enhance): Se usa un <form> estándar con un `action`
			que apunta a la acción por defecto de esta misma página (`?/default`).
			`use:enhance` intercepta el envío, lo hace vía fetch, y maneja el resultado
			(actualizar `form`, redirigir, etc.) de forma automática y robusta. -->
			<form
				method="POST"
				action="?/login"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="user">Usuario</Label>
					<Input id="user" name="user" type="text" required />
				</div>
				<div class="space-y-2">
					<Label for="password">Contraseña</Label>
					<Input id="password" name="password" type="password" required />
				</div>

				{#if form?.message}
					<p class="text-sm font-medium text-destructive">{form.message}</p>
				{/if}

				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Entrando...' : 'Entrar'}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>

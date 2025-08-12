<!-- Ruta: src/routes/login/+page.svelte -->
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';

	let email = '';
	let password = '';
	let loading = false;
	let errorMessage: string | null = null;

	async function handleLogin() {
		loading = true;
		errorMessage = null;

		const { error } = await authClient.signIn.email(
			{
				email,
				password
			},
			{
				// El callback onSuccess se usa para redirigir al usuario
				// después de un inicio de sesión exitoso.
				onSuccess: () => {
					toast.success('¡Bienvenido de nuevo!');
					goto('/', { invalidateAll: true });
				},
				// El callback onError nos permite mostrar un mensaje de
				// error específico sin recargar la página.
				onError: (ctx) => {
					errorMessage = ctx.error.message;
					toast.error('Error al iniciar sesión', {
						description: ctx.error.message
					});
				},
				// El callback onSettled se ejecuta siempre, tanto en éxito
				// como en error, ideal para resetear el estado de carga.
				onSettled: () => {
					loading = false;
				}
			}
		);
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-muted/40">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="space-y-1 text-center">
			<Card.Title class="text-2xl font-bold mt-4">Login</Card.Title>
			<Card.Description>Introduce tus credenciales para acceder</Card.Description>
		</Card.Header>
		<Card.Content>
			<!-- El formulario ahora llama a una función del lado del cliente
			 en lugar de usar una form action. Esto nos da más control sobre la UI. -->
			<form on:submit|preventDefault={handleLogin} class="space-y-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input bind:value={email} id="email" name="email" type="email" required />
				</div>
				<div class="space-y-2">
					<Label for="password">Contraseña</Label>
					<Input bind:value={password} id="password" name="password" type="password" required />
				</div>

				{#if errorMessage}
					<p class="text-sm font-medium text-destructive">{errorMessage}</p>
				{/if}

				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Entrando...' : 'Entrar'}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
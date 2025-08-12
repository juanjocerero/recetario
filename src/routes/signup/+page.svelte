<!-- Ruta: src/routes/signup/+page.svelte -->
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';

	let name = '';
	let email = '';
	let password = '';
	let loading = false;
	let errorMessage: string | null = null;

	async function handleSignup() {
		loading = true;
		errorMessage = null;

		await authClient.signUp.email(
			{
				name,
				email,
				password
			},
			{
				onSuccess: () => {
					toast.success('¡Cuenta creada con éxito!', {
						description: 'Te hemos redirigido a la página principal.'
					});
					goto('/', { invalidateAll: true });
				},
				onError: (ctx) => {
					errorMessage = ctx.error.message;
					toast.error('Error en el registro', {
						description: ctx.error.message
					});
				},
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
			<Card.Title class="text-2xl font-bold mt-4">Crear Cuenta</Card.Title>
			<Card.Description>Introduce tus datos para registrarte</Card.Description>
		</Card.Header>
		<Card.Content>
			<form on:submit|preventDefault={handleSignup} class="space-y-4">
				<div class="space-y-2">
					<Label for="name">Nombre</Label>
					<Input bind:value={name} id="name" name="name" type="text" required />
				</div>
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input bind:value={email} id="email" name="email" type="email" required />
				</div>
				<div class="space-y-2">
					<Label for="password">Contraseña</Label>
					<Input
						bind:value={password}
						id="password"
						name="password"
						type="password"
						required
						minlength={8}
					/>
				</div>

				{#if errorMessage}
					<p class="text-sm font-medium text-destructive">{errorMessage}</p>
				{/if}

				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Creando cuenta...' : 'Crear cuenta'}
				</Button>

				<div class="mt-4 text-center text-sm">
					¿Ya tienes una cuenta?
					<a href="/login" class="underline"> Inicia sesión </a>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>

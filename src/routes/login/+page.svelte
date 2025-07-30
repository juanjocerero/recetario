<!-- Ruta: src/routes/login/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let user = '';
	let password = '';
	let errorMessage: string | null = null;
	let loading = false;

	async function handleLogin() {
		loading = true;
		errorMessage = null;

		try {
			const response = await fetch('/api/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ user, password })
			});

			const data = await response.json();

			if (response.ok) {
				// Justificación: Tras un login exitoso, redirigimos al panel de administración
				// como se especifica en el plan (Paso 3.4).
				await goto('/admin');
			} else {
				errorMessage = data.message || 'Error desconocido';
			}
		} catch (error) {
			errorMessage = 'Error de red. No se pudo conectar al servidor.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-muted/40">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="space-y-1 text-center">
			<Card.Title class="text-2xl font-bold">Admin Login</Card.Title>
			<Card.Description>Introduce tus credenciales para acceder al panel</Card.Description>
		</Card.Header>
		<Card.Content>
			<form on:submit|preventDefault={handleLogin} class="space-y-4">
				<div class="space-y-2">
					<Label for="user">Usuario</Label>
					<Input id="user" name="user" type="text" placeholder="admin" bind:value={user} required />
				</div>
				<div class="space-y-2">
					<Label for="password">Contraseña</Label>
					<Input
						id="password"
						name="password"
						type="password"
						bind:value={password}
						required
					/>
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

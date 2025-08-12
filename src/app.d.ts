// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session as BetterAuthSession, User as BetterAuthUser } from 'better-auth';

// El objeto que devuelve auth.api.getSession()
type AuthSession = {
	session: BetterAuthSession;
	user: BetterAuthUser;
} | null;

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			// Ahora `session` tiene el tipo correcto
			session: AuthSession;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

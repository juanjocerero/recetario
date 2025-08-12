// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session as BetterAuthSession, User as BetterAuthUser } from 'better-auth';

type AuthSession = {
	session: BetterAuthSession;
	user: BetterAuthUser;
} | null;

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: AuthSession;
		}
		interface PageData {
			session?: BetterAuthSession;
			user?: BetterAuthUser;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
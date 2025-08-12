import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { hash, verify } from '@node-rs/argon2';

const prisma = new PrismaClient();

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'postgresql'
	}),
	emailAndPassword: {
		enabled: true,
		passwordHashing: {
			hash: async (password: string) => {
				return await hash(password, {
					timeCost: 3,
					memoryCost: 12288, // 12 MiB
					parallelism: 1
				});
			},
			verify: async (password: string, hash: string) => {
				return await verify(hash, password);
			}
		}
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: false,
				defaultValue: "user",
				input: false, // el usuario no puede modificar su rol
			},
		}
	}
});
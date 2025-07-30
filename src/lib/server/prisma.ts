// Ruta: src/lib/server/prisma.ts
import { PrismaClient } from '@prisma/client';

// Justificación: Se sigue el patrón singleton recomendado por Prisma
// para evitar crear múltiples conexiones a la base de datos en entornos
// serverless o durante el hot-reloading en desarrollo.
// La importación desde '@prisma/client' funciona porque `npx prisma generate`
// redirige este alias a la implementación generada en `node_modules/.prisma/client`.
const prisma = new PrismaClient();

export default prisma;
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.js';

const url = process.env.DATABASE_URL || 'file:./prisma/prisma/dev.db';
// Si la URL ya contiene el token, no necesitamos TURSO_AUTH_TOKEN separado
const authToken = process.env.TURSO_AUTH_TOKEN;

const clientConfig = { url };
if (authToken) {
  clientConfig.authToken = authToken;
}

const client = createClient(clientConfig);

export const db = drizzle(client, { schema });

// Re-exportar tablas para facilitar imports
export const { users, services, serviceLogs, performanceMetrics } = schema;

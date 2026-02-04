import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.js';

// Siempre usa Turso - DATABASE_URL es obligatoria
const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error('DATABASE_URL environment variable is required. Please set it to your Turso database URL.');
}

const clientConfig = { url };
if (authToken) {
  clientConfig.authToken = authToken;
}

const client = createClient(clientConfig);

export const db = drizzle(client, { schema });

// Re-exportar tablas para facilitar imports
export const { users, services, serviceLogs, performanceMetrics } = schema;

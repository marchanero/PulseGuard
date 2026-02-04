import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import * as schema from './schema.js';

// Cargar variables de entorno
dotenv.config();

// Crear cliente de Turso/libSQL
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Crear instancia de Drizzle
export const db = drizzle(client, { schema });

// Exportar el cliente para operaciones directas si es necesario
export { client };

// Exportar el schema para uso en queries
export * from './schema.js';

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.js';

// Siempre usa Turso - DATABASE_URL es obligatoria
const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('=====================================');
  console.error('ERROR: DATABASE_URL no está configurada');
  console.error('');
  console.error('Para configurar en Fly.io ejecuta:');
  console.error('fly secrets set DATABASE_URL="libsql://tu-db.turso.io"');
  console.error('fly secrets set TURSO_AUTH_TOKEN="tu-auth-token"');
  console.error('=====================================');
  throw new Error('DATABASE_URL environment variable is required. Please set it to your Turso database URL.');
}

const clientConfig = { url };

// El authToken puede venir en la URL o como variable separada
if (authToken) {
  clientConfig.authToken = authToken;
}

let client;
try {
  client = createClient(clientConfig);
} catch (error) {
  console.error('Error al crear cliente de base de datos:', error.message);
  throw error;
}

export const db = drizzle(client, { schema });

// Re-exportar tablas para facilitar imports
export const { users, services, serviceLogs, performanceMetrics } = schema;

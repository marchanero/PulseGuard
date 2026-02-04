/**
 * Migración para añadir la columna 'tags' a la tabla Service
 */

import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('DATABASE_URL es requerida');
  process.exit(1);
}

const clientConfig = { url };
if (authToken) {
  clientConfig.authToken = authToken;
}

const client = createClient(clientConfig);

async function migrate() {
  try {
    console.log('🔄 Añadiendo columna tags a la tabla Service...');
    
    // Verificar si la columna ya existe
    const result = await client.execute(`
      PRAGMA table_info(Service)
    `);
    
    const hasTagsColumn = result.rows.some(col => col.name === 'tags');
    
    if (!hasTagsColumn) {
      await client.execute(`
        ALTER TABLE Service ADD COLUMN tags TEXT DEFAULT NULL
      `);
      console.log('✅ Columna tags añadida correctamente');
    } else {
      console.log('✅ La columna tags ya existe');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrate();

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
    console.log('Agregando campo isPublic a la tabla Service...');
    
    // Verificar si la columna ya existe
    const result = await client.execute(`
      PRAGMA table_info(Service)
    `);
    
    const hasIsPublic = result.rows.some(col => col.name === 'isPublic');
    
    if (!hasIsPublic) {
      await client.execute(`
        ALTER TABLE Service ADD COLUMN isPublic INTEGER DEFAULT 0
      `);
      console.log('Campo isPublic agregado exitosamente');
    } else {
      console.log('El campo isPublic ya existe');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error en migración:', error);
    process.exit(1);
  }
}

migrate();

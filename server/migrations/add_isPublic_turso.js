import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: ['.env.local', '.env'] });

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('DATABASE_URL no está definida');
  process.exit(1);
}

const clientConfig = { url };
if (authToken) {
  clientConfig.authToken = authToken;
}

const client = createClient(clientConfig);

async function migrate() {
  try {
    console.log('Conectando a TursoDB...');
    console.log('URL:', url.replace(/:.*@/, ':***@')); // Ocultar token en logs
    
    // Verificar si la columna ya existe
    const result = await client.execute(`
      PRAGMA table_info(Service)
    `);
    
    const hasIsPublic = result.rows.some(col => col.name === 'isPublic');
    
    if (!hasIsPublic) {
      console.log('Agregando campo isPublic a la tabla Service...');
      await client.execute(`
        ALTER TABLE Service ADD COLUMN isPublic INTEGER DEFAULT 0
      `);
      console.log('Campo isPublic agregado exitosamente');
    } else {
      console.log('El campo isPublic ya existe');
    }
    
    // Verificar las columnas
    const columns = await client.execute('PRAGMA table_info(Service)');
    console.log('\nColumnas de Service:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error en migración:', error.message);
    if (error.cause) {
      console.error('Causa:', error.cause.message);
    }
    process.exit(1);
  }
}

migrate();

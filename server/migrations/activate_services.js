import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const clientConfig = { url };
if (authToken) clientConfig.authToken = authToken;

const client = createClient(clientConfig);

async function activateServices() {
  try {
    console.log('Activando servicios...');
    
    // Activar servicios y marcar como no borrados
    await client.execute("UPDATE Service SET isActive = 1, isDeleted = 0 WHERE isPublic = 1");
    
    const result = await client.execute('SELECT id, name, isActive, isDeleted, isPublic FROM Service');
    console.log('\nServicios actualizados:');
    result.rows.forEach(r => {
      console.log(`  - ${r.name}: isActive=${r.isActive}, isDeleted=${r.isDeleted}, isPublic=${r.isPublic}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

activateServices();

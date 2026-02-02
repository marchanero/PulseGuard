import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const clientConfig = { url };
if (authToken) clientConfig.authToken = authToken;

const client = createClient(clientConfig);

async function updateServices() {
  try {
    console.log('Actualizando servicios para que sean públicos...');
    
    // Actualizar algunos servicios para que sean públicos
    await client.execute("UPDATE Service SET isPublic = 1 WHERE name IN ('Google', 'Google-DNS', 'Cloudflare')");
    
    const result = await client.execute('SELECT id, name, isPublic FROM Service');
    console.log('\nServicios actualizados:');
    result.rows.forEach(r => {
      console.log(`  - ${r.name}: ${r.isPublic ? 'Público' : 'Privado'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateServices();

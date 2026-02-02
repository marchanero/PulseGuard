import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const clientConfig = { url };
if (authToken) clientConfig.authToken = authToken;

const client = createClient(clientConfig);

async function checkServices() {
  try {
    const result = await client.execute('SELECT id, name, isActive, isDeleted, isPublic FROM Service');
    console.log('Servicios en la base de datos:');
    result.rows.forEach(r => {
      console.log(`  - ${r.name}: isActive=${r.isActive}, isDeleted=${r.isDeleted}, isPublic=${r.isPublic}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkServices();

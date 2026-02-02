import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const clientConfig = { url };
if (authToken) {
  clientConfig.authToken = authToken;
}

const client = createClient(clientConfig);

async function testQuery() {
  try {
    console.log('Probando consulta SQL...');
    
    // Probar json_group_array
    const result1 = await client.execute(`
      SELECT json_group_array(
        json_object(
          'id', id,
          'status', status,
          'responseTime', responseTime
        )
      ) as logs
      FROM ServiceLog
      WHERE serviceId = 1
      ORDER BY timestamp DESC
      LIMIT 5
    `);
    console.log('json_group_array result:', result1.rows[0]?.logs);
    
    // Probar GROUP_CONCAT
    const result2 = await client.execute(`
      SELECT '[' || GROUP_CONCAT(
        json_object(
          'id', id,
          'status', status,
          'responseTime', responseTime
        ),
        ','
      ) || ']' as logs
      FROM ServiceLog
      WHERE serviceId = 1
      ORDER BY timestamp DESC
      LIMIT 5
    `);
    console.log('GROUP_CONCAT result:', result2.rows[0]?.logs);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testQuery();

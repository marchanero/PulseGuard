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

async function createTables() {
  try {
    console.log('Creando tablas ServiceLog y PerformanceMetric...');
    
    // Crear tabla ServiceLog
    await client.execute(`
      CREATE TABLE IF NOT EXISTS ServiceLog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serviceId INTEGER NOT NULL,
        status TEXT NOT NULL,
        responseTime INTEGER,
        message TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (serviceId) REFERENCES Service(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla ServiceLog creada');
    
    // Crear tabla PerformanceMetric
    await client.execute(`
      CREATE TABLE IF NOT EXISTS PerformanceMetric (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serviceId INTEGER NOT NULL,
        responseTime INTEGER NOT NULL,
        status TEXT NOT NULL,
        uptime REAL NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (serviceId) REFERENCES Service(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla PerformanceMetric creada');
    
    // Crear índice para mejorar rendimiento
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_service_log_service_id ON ServiceLog(serviceId)
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_service_log_timestamp ON ServiceLog(timestamp)
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_performance_metric_service_id ON PerformanceMetric(serviceId)
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_performance_metric_timestamp ON PerformanceMetric(timestamp)
    `);
    console.log('Índices creados');
    
    // Verificar tablas creadas
    const tables = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name IN ('ServiceLog', 'PerformanceMetric')
    `);
    console.log('\nTablas creadas:');
    tables.rows.forEach(t => {
      console.log(`  - ${t.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error creando tablas:', error.message);
    if (error.cause) {
      console.error('Causa:', error.cause.message);
    }
    process.exit(1);
  }
}

createTables();

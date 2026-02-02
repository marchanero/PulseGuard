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

async function checkTables() {
  try {
    console.log('Verificando tablas...');
    
    // Verificar si la tabla ServiceLog existe
    const serviceLogResult = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='ServiceLog'
    `);
    console.log('Tabla ServiceLog existe:', serviceLogResult.rows.length > 0);
    
    // Verificar si la tabla PerformanceMetric existe
    const performanceMetricResult = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='PerformanceMetric'
    `);
    console.log('Tabla PerformanceMetric existe:', performanceMetricResult.rows.length > 0);
    
    // Verificar logs en ServiceLog
    if (serviceLogResult.rows.length > 0) {
      const logsResult = await client.execute('SELECT COUNT(*) as count FROM ServiceLog');
      console.log('Total de logs en ServiceLog:', logsResult.rows[0].count);
      
      // Mostrar algunos logs
      const sampleLogs = await client.execute('SELECT * FROM ServiceLog LIMIT 5');
      console.log('Muestra de logs:');
      sampleLogs.rows.forEach(log => {
        console.log(`  - ServiceId: ${log.serviceId}, Status: ${log.status}, ResponseTime: ${log.responseTime}, Timestamp: ${log.timestamp}`);
      });
    }
    
    // Verificar métricas en PerformanceMetric
    if (performanceMetricResult.rows.length > 0) {
      const metricsResult = await client.execute('SELECT COUNT(*) as count FROM PerformanceMetric');
      console.log('Total de métricas en PerformanceMetric:', metricsResult.rows[0].count);
      
      // Mostrar algunas métricas
      const sampleMetrics = await client.execute('SELECT * FROM PerformanceMetric LIMIT 5');
      console.log('Muestra de métricas:');
      sampleMetrics.rows.forEach(metric => {
        console.log(`  - ServiceId: ${metric.serviceId}, ResponseTime: ${metric.responseTime}, Status: ${metric.status}, Uptime: ${metric.uptime}, Timestamp: ${metric.timestamp}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTables();

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const getDbClient = () => {
  // Primero intentar conectar con TURSO_* (producción/remoto)
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    console.log('📡 Conectando a Turso DB remota...');
    return createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
  }
  
  // Fallback a DATABASE_URL (local)
  if (process.env.DATABASE_URL) {
    console.log('💾 Conectando a base de datos local...');
    return createClient({
      url: process.env.DATABASE_URL
    });
  }
  
  throw new Error('❌ No se encontró DATABASE_URL ni TURSO_DATABASE_URL en las variables de entorno');
};

async function migrate() {
  const db = getDbClient();

  try {
    console.log('🔧 Creando tabla maintenance_windows...');

    // Crear tabla de ventanas de mantenimiento
    await db.execute(`
      CREATE TABLE IF NOT EXISTS maintenance_windows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_recurring INTEGER DEFAULT 0,
        recurring_pattern TEXT,
        is_active INTEGER DEFAULT 1,
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Tabla maintenance_windows creada correctamente');

    // Crear índices para mejorar el rendimiento
    console.log('📊 Creando índices...');

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_maintenance_service 
      ON maintenance_windows(service_id)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_maintenance_active 
      ON maintenance_windows(is_active)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_maintenance_times 
      ON maintenance_windows(start_time, end_time)
    `);

    console.log('✅ Índices creados correctamente');

    // Verificar la creación
    const result = await db.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='maintenance_windows'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Migración completada exitosamente');
      console.log('📋 Tabla maintenance_windows está lista para usar');
    } else {
      console.error('❌ Error: La tabla no fue creada');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

// Ejecutar migración
migrate()
  .then(() => {
    console.log('🎉 Proceso de migración finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

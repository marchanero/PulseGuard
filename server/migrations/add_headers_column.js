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
    console.log('🔧 Agregando columna headers a la tabla services...');

    // Agregar columna headers
    await db.execute(`
      ALTER TABLE Service ADD COLUMN headers TEXT
    `);

    console.log('✅ Columna headers agregada correctamente');

    // Verificar la creación
    const result = await db.execute(`
      PRAGMA table_info(Service)
    `);

    const headersColumn = result.rows.find(row => row.name === 'headers');
    
    if (headersColumn) {
      console.log('✅ Migración completada exitosamente');
      console.log('📋 Columna headers está lista para usar');
      console.log('💡 Ahora puedes agregar headers personalizados a tus servicios');
    } else {
      console.error('❌ Error: La columna no fue creada');
    }

  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️  La columna headers ya existe, saltando migración');
    } else {
      console.error('❌ Error durante la migración:', error);
      throw error;
    }
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

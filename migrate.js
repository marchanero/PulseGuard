import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL || 'libsql://pulseguard-marchanero.aws-eu-west-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzAwNDY2NjcsImlkIjoiOWNiNWZhNmYtNGY3NC00OGJjLThiZmUtYzgxZWNhMzEyYjJiIiwicmlkIjoiYmMwZGI5NmMtYjQ0Yi00MmNlLThkNmEtZDlhNmVkZmNiNTFhIn0.QFCfVMAxieF0C292O1JeoUn1b1jz8aGdc8CT8fIxhrSz5Qb2qd195eOtL993NwKgyefCbTolftaJb6VgEzw_AQ';

const client = createClient({
  url,
  authToken
});

async function migrate() {
  console.log('Creating tables...');
  console.log('URL:', url);

  // Create User table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      alias TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('User table created');

  // Create Service table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS Service (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'HTTP',
      url TEXT NOT NULL,
      host TEXT,
      port INTEGER,
      description TEXT,
      status TEXT DEFAULT 'unknown',
      responseTime INTEGER,
      uptime REAL DEFAULT 100,
      lastChecked TEXT,
      checkInterval INTEGER DEFAULT 60,
      isActive INTEGER DEFAULT 1,
      isDeleted INTEGER DEFAULT 0,
      deletedAt TEXT,
      totalMonitoredTime INTEGER DEFAULT 0,
      onlineTime INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      contentMatch TEXT,
      sslExpiryDate TEXT,
      sslDaysRemaining INTEGER,
      dbType TEXT,
      dbConnectionString TEXT
    )
  `);
  console.log('Service table created');

  // Create ServiceLog table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS ServiceLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serviceId INTEGER REFERENCES Service(id) ON DELETE CASCADE,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL,
      responseTime INTEGER,
      message TEXT
    )
  `);
  console.log('ServiceLog table created');

  // Create PerformanceMetric table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS PerformanceMetric (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serviceId INTEGER REFERENCES Service(id) ON DELETE CASCADE,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      responseTime INTEGER NOT NULL,
      status TEXT NOT NULL,
      uptime REAL NOT NULL
    )
  `);
  console.log('PerformanceMetric table created');

  console.log('All tables created successfully!');
}

migrate().catch(console.error);

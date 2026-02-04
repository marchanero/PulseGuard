/**
 * Migration: Create notification tables
 * Run with: node server/migrations/create_notification_tables.js
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL which contains both URL and authToken
const databaseUrl = process.env.DATABASE_URL;
let url, authToken;

if (databaseUrl) {
  const urlObj = new URL(databaseUrl);
  authToken = urlObj.searchParams.get('authToken');
  urlObj.searchParams.delete('authToken');
  url = urlObj.toString();
}

const client = createClient({
  url: url || process.env.TURSO_DATABASE_URL,
  authToken: authToken || process.env.TURSO_AUTH_TOKEN
});

async function migrate() {
  console.log('🚀 Starting notification tables migration...\n');

  try {
    // 1. Create NotificationChannel table
    console.log('📦 Creating NotificationChannel table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS NotificationChannel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config TEXT NOT NULL,
        isEnabled INTEGER DEFAULT 1,
        isDefault INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
        updatedAt TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
      )
    `);
    console.log('✅ NotificationChannel table created\n');

    // 2. Create NotificationRule table
    console.log('📦 Creating NotificationRule table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS NotificationRule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serviceId INTEGER REFERENCES Service(id) ON DELETE CASCADE,
        channelId INTEGER REFERENCES NotificationChannel(id) ON DELETE CASCADE,
        events TEXT NOT NULL,
        threshold INTEGER DEFAULT 1,
        cooldown INTEGER DEFAULT 300,
        isEnabled INTEGER DEFAULT 1,
        lastNotified TEXT,
        consecutiveFailures INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
        updatedAt TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
      )
    `);
    console.log('✅ NotificationRule table created\n');

    // 3. Create NotificationHistory table
    console.log('📦 Creating NotificationHistory table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS NotificationHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channelId INTEGER REFERENCES NotificationChannel(id) ON DELETE SET NULL,
        serviceId INTEGER REFERENCES Service(id) ON DELETE SET NULL,
        event TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL,
        errorMessage TEXT,
        metadata TEXT,
        sentAt TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
      )
    `);
    console.log('✅ NotificationHistory table created\n');

    // 4. Create indexes for better performance
    console.log('📦 Creating indexes...');
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_notification_rule_service 
      ON NotificationRule(serviceId)
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_notification_rule_channel 
      ON NotificationRule(channelId)
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_notification_history_channel 
      ON NotificationHistory(channelId)
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_notification_history_service 
      ON NotificationHistory(serviceId)
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at 
      ON NotificationHistory(sentAt DESC)
    `);
    
    console.log('✅ Indexes created\n');

    // 5. Verify tables
    console.log('🔍 Verifying tables...');
    const tables = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE 'Notification%'
      ORDER BY name
    `);
    
    console.log('Tables created:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.name}`);
    });

    console.log('\n✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();

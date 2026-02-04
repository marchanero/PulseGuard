import { db } from '../lib/db.js';
import { sql } from 'drizzle-orm';

/**
 * Migration: Add content validation fields
 * Adds lastContentMatch to services table and contentMatchStatus to serviceLogs table
 */
async function addContentValidationFields() {
  console.log('⏳ Adding content validation fields...');

  try {
    // Add lastContentMatch to services table
    await db.run(sql`
      ALTER TABLE Service 
      ADD COLUMN lastContentMatch INTEGER
    `);
    console.log('✅ Added lastContentMatch to Service table');

    // Add contentMatchStatus to serviceLogs table
    await db.run(sql`
      ALTER TABLE ServiceLog 
      ADD COLUMN contentMatchStatus INTEGER
    `);
    console.log('✅ Added contentMatchStatus to ServiceLog table');

    console.log('✅ Migration completed successfully');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️  Columns already exist, skipping migration');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }
}

// Execute migration if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addContentValidationFields()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default addContentValidationFields;

import { db } from '.';

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Create sessions table if it doesn't exist (needed for Replit Auth)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `);
    console.log('Sessions table created or already exists');
    
    // Create index on expire field if it doesn't exist
    await db.execute(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);
    `);
    console.log('Sessions expire index created or already exists');
    
    // Create users table if it doesn't exist (needed for Replit Auth)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table created or already exists');
    
    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrate();

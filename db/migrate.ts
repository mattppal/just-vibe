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
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add missing columns to users table if they don't exist
    try {
      // Check if first_name column exists
      const columnExists = await db.execute(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'first_name';
      `);
      
      // If first_name doesn't exist, add all missing columns
      if (!columnExists || columnExists.rows.length === 0) {
        console.log('Adding missing columns to users table');
        await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;`);
        await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;`);
        await db.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;`);
      }
    } catch (error) {
      console.error('Error checking or adding columns:', error);
      // Continue execution even if this fails
    }
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

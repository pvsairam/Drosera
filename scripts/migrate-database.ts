import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as schema from '../shared/schema';

async function main() {
  console.log('🚀 Starting database migration...');

  const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL or DIRECT_DATABASE_URL not found in environment variables');
    console.log('');
    console.log('Please set one of these environment variables:');
    console.log('  export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"');
    console.log('  export DIRECT_DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"');
    process.exit(1);
  }

  console.log('📡 Connecting to database...');
  console.log(`🔗 Host: ${new URL(databaseUrl).hostname}`);

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  try {
    console.log('📦 Running migrations from ./drizzle directory...');
    
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Migrations completed successfully!');
    console.log('');
    console.log('📊 Database tables created:');
    console.log('  - oracle_prices');
    console.log('  - incidents');
    console.log('  - asset_configs');
    console.log('  - system_config');
    console.log('  - chain_status');
    console.log('  - simulation_scenarios');
    console.log('');
    console.log('🎉 Database is ready for production!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();

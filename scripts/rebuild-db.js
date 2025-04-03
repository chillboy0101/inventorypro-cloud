const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Add your Supabase credentials directly here for testing
// IMPORTANT: REMOVE THESE CREDENTIALS AFTER RUNNING THE SCRIPT
const supabaseUrl = 'https://pgmdsotwmkjrrdzhxipt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbWRzb3R3bWtqcnJkemh4aXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTYxOTQsImV4cCI6MjA1ODczMjE5NH0.ix6zHhmLccfczQzcuILylqURATGuU6O2usF8uwEWumf8';

// Define the migration files to execute in order
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');
const RESET_SCHEMA_FILE = '20240330_reset_schema.sql';
const ADDITIONAL_MIGRATIONS = [
  '20240327001000_add_product_icon_columns.sql'
];

async function rebuildDatabase() {
  console.log('\n🔄 InventoryPro Database Rebuilder');
  console.log('=================================');
  
  console.log('\n⏳ Connecting to Supabase...');
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Step 1: Read and execute the reset schema SQL
    console.log('\n📋 Step 1: Resetting database schema...');
    const resetSchemaPath = path.join(MIGRATIONS_DIR, RESET_SCHEMA_FILE);
    
    if (!fs.existsSync(resetSchemaPath)) {
      throw new Error(`Reset schema file not found: ${resetSchemaPath}`);
    }
    
    const resetSchemaSql = fs.readFileSync(resetSchemaPath, 'utf8');
    
    // Execute the SQL via the Supabase REST API
    // Note: This requires RESTED feature or Supabase postgres access
    console.log('🛑 Since Supabase JS client doesn\'t support direct SQL execution,');
    console.log('   you need to execute this SQL through the Supabase Dashboard SQL Editor:');
    console.log('\n================================================');
    console.log(resetSchemaSql);
    console.log('================================================\n');
    
    // Step 2: Apply additional migrations
    console.log('\n📋 Step 2: Applying additional migrations...');
    for (const migrationFile of ADDITIONAL_MIGRATIONS) {
      const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️ Migration file not found: ${migrationPath}`);
        continue;
      }
      
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      console.log(`\n⏳ Migration: ${migrationFile}`);
      console.log('================================================');
      console.log(migrationSql);
      console.log('================================================\n');
    }
    
    console.log('\n✅ Schema SQL prepared!');
    console.log('\n📝 Instructions:');
    console.log('1. Log in to Supabase Dashboard: https://app.supabase.com');
    console.log('2. Go to your project: https://app.supabase.com/project/pgmdsotwmkjrrdzhxipt');
    console.log('3. Click on "SQL Editor" in the left sidebar');
    console.log('4. Create a new query');
    console.log('5. Copy and paste the SQL above');
    console.log('6. Run the query to rebuild your database');
    
    console.log('\n⚠️ IMPORTANT: Remember to remove your Supabase credentials from this script!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the rebuild process
rebuildDatabase();

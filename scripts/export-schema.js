const fs = require('fs');
const path = require('path');

// Define the migration files to export in order
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');
const OUTPUT_FILE = path.join(__dirname, 'rebuild-database.sql');
const MIGRATIONS = [
  '20240330_reset_schema.sql',
  '20240327001000_add_product_icon_columns.sql'
];

function exportSchema() {
  console.log('\n📦 InventoryPro Schema Exporter');
  console.log('===============================');
  
  try {
    let combinedSql = '-- InventoryPro Database Rebuild Script\n';
    combinedSql += `-- Generated on: ${new Date().toISOString()}\n\n`;
    
    // Process each migration file
    for (const migrationFile of MIGRATIONS) {
      const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️ Migration file not found: ${migrationPath}`);
        continue;
      }
      
      console.log(`📄 Processing: ${migrationFile}`);
      
      const sql = fs.readFileSync(migrationPath, 'utf8');
      combinedSql += `-- Start of ${migrationFile}\n`;
      combinedSql += sql;
      combinedSql += `\n-- End of ${migrationFile}\n\n`;
    }
    
    // Write the combined SQL to the output file
    fs.writeFileSync(OUTPUT_FILE, combinedSql);
    
    console.log(`\n✅ Schema exported to: ${OUTPUT_FILE}`);
    console.log('\n📝 Instructions:');
    console.log('1. Log in to Supabase Dashboard: https://app.supabase.com');
    console.log('2. Go to your project: pgmdsotwmkjrrdzhxipt');
    console.log('3. Click on "SQL Editor" in the left sidebar');
    console.log('4. Create a new query');
    console.log('5. Open the exported SQL file and copy its contents');
    console.log('6. Paste the SQL into the query editor');
    console.log('7. Run the query to rebuild your database');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the export process
exportSchema();

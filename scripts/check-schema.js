const { createClient } = require('@supabase/supabase-js');

// Add your Supabase credentials directly here for testing
// IMPORTANT: REMOVE THESE CREDENTIALS AFTER RUNNING THE SCRIPT
const supabaseUrl = 'https://pgmdsotwmkjrrdzhxipt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbWRzb3R3bWtqcnJkemh4aXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTYxOTQsImV4cCI6MjA1ODczMjE5NH0.ix6zHhmLccfczQzcuILylqURATGuU6O2usF8uwEWumf8';

async function checkSchema() {
  console.log('\n🔍 InventoryPro Database Schema Checker');
  console.log('=====================================');
  
  console.log('\n⏳ Connecting to Supabase and checking schema...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Expected schema based on 20240330_reset_schema.sql
  const expectedSchema = {
    products: [
      'id', 'name', 'description', 'sku', 'category', 'stock', 
      'cost_price', 'selling_price', 'value', 'location', 
      'reorder_level', 'created_at', 'updated_at'
    ],
    orders: [
      'id', 'customer', 'status', 'total_items', 'total_amount', 
      'created_at', 'updated_at'
    ],
    order_items: [
      'id', 'order_id', 'product_id', 'quantity', 'price',
      'product_name', 'product_description', 'product_category',
      'product_location', 'product_sku', 'product_unit', 'created_at'
    ],
    stock_adjustments: [
      'id', 'product_id', 'quantity', 'adjustment_type', 'reason',
      'previous_quantity', 'new_quantity', 'created_at', 'updated_at'
    ]
  };

  // Check each table
  const tables = Object.keys(expectedSchema);
  let hasDiscrepancies = false;

  for (const table of tables) {
    try {
      // Try to get a row from the table to inspect its structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`\n❌ Error querying '${table}' table: ${error.message}`);
        hasDiscrepancies = true;
        continue;
      }
      
      if (!data || data.length === 0) {
        console.log(`\n⚠️ Table '${table}' exists but has no data to inspect columns`);
        continue;
      }
      
      // We have data, so we can inspect the columns
      const actualColumns = Object.keys(data[0]);
      console.log(`\n📋 Table '${table}':`);
      console.log(`   ✅ Found ${actualColumns.length} columns: ${actualColumns.join(', ')}`);
      
      // Compare with expected columns
      checkColumnsMatch(table, expectedSchema[table], actualColumns);
    } catch (err) {
      console.log(`\n❌ Error processing '${table}' table: ${err.message}`);
      hasDiscrepancies = true;
    }
  }

  // Additional check for any custom fields in TypeScript types not in database
  try {
    console.log('\n🔍 Checking for TypeScript types that might need database updates:');
    console.log('   - Looking for custom_icon and custom_icon_type fields in products table...');
    
    const { data: productsWithCustomIcon, error } = await supabase
      .from('products')
      .select('custom_icon, custom_icon_type')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('   ❌ custom_icon and custom_icon_type fields from TypeScript types are missing in the database');
        console.log('      You may need to run the migration: 20240327001000_add_product_icon_columns.sql');
        hasDiscrepancies = true;
      } else {
        console.log(`   ❌ Error checking for icon fields: ${error.message}`);
      }
    } else if (productsWithCustomIcon) {
      console.log('   ✅ custom_icon and custom_icon_type fields exist in products table');
    }
  } catch (err) {
    console.log(`   ❌ Error checking for icon fields: ${err.message}`);
  }

  console.log('\n=====================================');
  if (hasDiscrepancies) {
    console.log('❌ Schema check complete. Discrepancies found!');
    console.log('   Run your migrations to sync your database with your schema definition.');
  } else {
    console.log('✅ Schema check complete! No discrepancies found.');
    console.log('   Your TypeScript types and database schema are in sync.');
  }
  
  console.log('\n⚠️ IMPORTANT: Remember to remove your Supabase credentials from this script!');
}

function checkColumnsMatch(table, expected, actual) {
  const missing = expected.filter(col => !actual.includes(col));
  const extra = actual.filter(col => !expected.includes(col));
  
  if (missing.length > 0) {
    console.log(`   ❌ Missing columns in '${table}': ${missing.join(', ')}`);
    return false;
  }
  
  if (extra.length > 0) {
    console.log(`   ℹ️ Extra columns in '${table}' (not in expected schema): ${extra.join(', ')}`);
  }
  
  return missing.length === 0;
}

// Run the check
checkSchema();

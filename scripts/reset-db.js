import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgmdsotwmkjrrdzhxipt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbWRzb3R3bWtqcnJkemh4aXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTYxOTQsImV4cCI6MjA1ODczMjE5NH0.ix6zHhmLccfczQzcuILylqURATGuU6O2usFuwEWumf8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase() {
  try {
    console.log('Starting database reset...');

    // Drop existing tables
    console.log('Dropping existing tables...');
    await supabase.from('stock_adjustments').delete().neq('id', '');
    await supabase.from('order_items').delete().neq('id', '');
    await supabase.from('orders').delete().neq('id', '');
    await supabase.from('products').delete().neq('id', '');

    // Drop and recreate the products table
    console.log('Recreating products table...');
    await supabase.from('products').delete();
    
    // Create a test product to verify the schema
    const testProduct = {
      id: 'TEST-001',
      name: 'Test Product',
      description: 'Test Description',
      sku: 'TEST001',
      category: 'Test Category',
      stock: 0,
      cost_price: 10.00,
      selling_price: 20.00,
      location: 'Test Location',
      reorder_level: 5
    };

    const { error } = await supabase.from('products').insert(testProduct);
    
    if (error) {
      console.error('Error creating test product:', error);
      throw error;
    }

    // Delete the test product
    await supabase.from('products').delete().eq('id', 'TEST-001');

    console.log('Database reset successful!');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 
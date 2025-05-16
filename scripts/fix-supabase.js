const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Extract Supabase credentials from environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing Supabase credentials in .env file.');
  process.exit(1);
}

// Initialize Supabase client - using anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to create products table
async function fixProducts() {
  console.log('Fixing products table...');
  
  // Get existing products
  const { data: existingProducts, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .limit(10);
  
  if (fetchError) {
    console.error('Error fetching products:', fetchError.message);
  } else {
    console.log(`Found ${existingProducts?.length || 0} existing products`);
    
    // Check if we need to insert sample products
    if (!existingProducts || existingProducts.length === 0) {
      console.log('Inserting sample products...');
      
      // Define sample products
      const sampleProducts = [
        {
          id: 'PRD-20240329000001-001',
          name: 'Wireless Mouse',
          description: 'MX Master 3',
          sku: 'WM-001',
          category: 'Electronics',
          stock: 42,
          cost_price: 69.99,
          selling_price: 99.99,
          location: 'Warehouse A, A12',
          reorder_level: 10
        },
        {
          id: 'PRD-20240329000002-001',
          name: 'Mechanical Keyboard',
          description: 'Keychron K2',
          sku: 'KB-002',
          category: 'Electronics',
          stock: 5,
          cost_price: 104.99,
          selling_price: 149.99,
          location: 'Warehouse B, B05',
          reorder_level: 10
        },
        {
          id: 'PRD-20240329000003-001',
          name: '24" Monitor',
          description: 'Dell UltraSharp',
          sku: 'MON-003',
          category: 'Electronics',
          stock: 0,
          cost_price: 209.99,
          selling_price: 299.99,
          location: 'Warehouse A, A08',
          reorder_level: 5
        },
        {
          id: 'PRD-20240329000004-001',
          name: 'Office Chair',
          description: 'Ergonomic Pro',
          sku: 'FRN-004',
          category: 'Furniture',
          stock: 12,
          cost_price: 139.99,
          selling_price: 199.99,
          location: 'Warehouse C, C15',
          reorder_level: 5
        },
        {
          id: 'PRD-20240329000005-001',
          name: 'Notebook',
          description: 'A4 Lined',
          sku: 'STN-005',
          category: 'Stationery',
          stock: 156,
          cost_price: 3.49,
          selling_price: 4.99,
          location: 'Warehouse B, B22',
          reorder_level: 50
        }
      ];
      
      // Insert sample products one by one to avoid errors
      for (const product of sampleProducts) {
        const { error } = await supabase.from('products').upsert(product);
        if (error) {
          console.error(`Error inserting product ${product.id}:`, error.message);
        } else {
          console.log(`Successfully inserted/updated product ${product.id}`);
        }
      }
    }
  }
  
  console.log('Products table fixed!');
  return true;
}

// Function to fix orders table and sample data
async function fixOrders() {
  console.log('Fixing orders table...');
  
  // Get existing orders
  const { data: existingOrders, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .limit(10);
  
  if (fetchError) {
    console.error('Error fetching orders:', fetchError.message);
  } else {
    console.log(`Found ${existingOrders?.length || 0} existing orders`);
    
    // Check if we need to insert sample orders
    if (!existingOrders || existingOrders.length === 0) {
      console.log('Inserting sample orders...');
      
      // Define sample orders
      const sampleOrders = [
        {
          id: 'ORD-20240329000001-001',
          customer: 'John Smith',
          status: 'delivered',
          total_items: 2,
          total_amount: 249.98
        },
        {
          id: 'ORD-20240329000002-001',
          customer: 'Jane Doe',
          status: 'processing',
          total_items: 1,
          total_amount: 299.99
        },
        {
          id: 'ORD-20240329000003-001',
          customer: 'Bob Johnson',
          status: 'pending',
          total_items: 3,
          total_amount: 454.97
        }
      ];
      
      // Insert sample orders one by one
      for (const order of sampleOrders) {
        const { error } = await supabase.from('orders').upsert(order);
        if (error) {
          console.error(`Error inserting order ${order.id}:`, error.message);
        } else {
          console.log(`Successfully inserted/updated order ${order.id}`);
        }
      }
    }
  }
  
  console.log('Orders table fixed!');
  return true;
}

// Function to fix order_items table and sample data
async function fixOrderItems() {
  console.log('Fixing order_items table...');
  
  // Get existing order items
  const { data: existingItems, error: fetchError } = await supabase
    .from('order_items')
    .select('*')
    .limit(10);
  
  if (fetchError) {
    console.error('Error fetching order items:', fetchError.message);
  } else {
    console.log(`Found ${existingItems?.length || 0} existing order items`);
    
    // Check if we need to insert sample order items
    if (!existingItems || existingItems.length === 0) {
      console.log('Inserting sample order items...');
      
      // Define sample order items
      const sampleOrderItems = [
        {
          id: 'ORI-20240329000001-001',
          order_id: 'ORD-20240329000001-001',
          product_id: 'PRD-20240329000001-001',
          quantity: 1,
          price: 99.99
        },
        {
          id: 'ORI-20240329000001-002',
          order_id: 'ORD-20240329000001-001',
          product_id: 'PRD-20240329000002-001',
          quantity: 1,
          price: 149.99
        },
        {
          id: 'ORI-20240329000002-001',
          order_id: 'ORD-20240329000002-001',
          product_id: 'PRD-20240329000003-001',
          quantity: 1,
          price: 299.99
        },
        {
          id: 'ORI-20240329000003-001',
          order_id: 'ORD-20240329000003-001',
          product_id: 'PRD-20240329000004-001',
          quantity: 2,
          price: 399.98
        },
        {
          id: 'ORI-20240329000003-002',
          order_id: 'ORD-20240329000003-001',
          product_id: 'PRD-20240329000005-001',
          quantity: 11,
          price: 54.99
        }
      ];
      
      // Insert sample order items one by one
      for (const item of sampleOrderItems) {
        const { error } = await supabase.from('order_items').upsert(item);
        if (error) {
          console.error(`Error inserting order item ${item.id}:`, error.message);
        } else {
          console.log(`Successfully inserted/updated order item ${item.id}`);
        }
      }
    }
  }
  
  console.log('Order_items table fixed!');
  return true;
}

// Function to fix stock_adjustments table and sample data
async function fixStockAdjustments() {
  console.log('Fixing stock_adjustments table...');
  
  // Get existing stock adjustments
  const { data: existingAdjustments, error: fetchError } = await supabase
    .from('stock_adjustments')
    .select('*')
    .limit(10);
  
  if (fetchError) {
    console.error('Error fetching stock adjustments:', fetchError.message);
  } else {
    console.log(`Found ${existingAdjustments?.length || 0} existing stock adjustments`);
    
    // Check if we need to insert sample stock adjustments
    if (!existingAdjustments || existingAdjustments.length === 0) {
      console.log('Inserting sample stock adjustments...');
      
      // Define sample stock adjustments
      const sampleAdjustments = [
        {
          id: 'ADJ-20240329000001-001',
          product_id: 'PRD-20240329000001-001',
          quantity: 5,
          adjustment_type: 'in',
          reason: 'Restocking',
          previous_quantity: 37,
          new_quantity: 42
        },
        {
          id: 'ADJ-20240329000002-001',
          product_id: 'PRD-20240329000002-001',
          quantity: 2,
          adjustment_type: 'out',
          reason: 'Damaged items',
          previous_quantity: 7,
          new_quantity: 5
        },
        {
          id: 'ADJ-20240329000003-001',
          product_id: 'PRD-20240329000003-001',
          quantity: 3,
          adjustment_type: 'in',
          reason: 'Initial stock',
          previous_quantity: 0,
          new_quantity: 3
        }
      ];
      
      // Insert sample stock adjustments one by one
      for (const adjustment of sampleAdjustments) {
        const { error } = await supabase.from('stock_adjustments').upsert(adjustment);
        if (error) {
          console.error(`Error inserting stock adjustment ${adjustment.id}:`, error.message);
        } else {
          console.log(`Successfully inserted/updated stock adjustment ${adjustment.id}`);
        }
      }
    }
  }
  
  console.log('Stock_adjustments table fixed!');
  return true;
}

// Main function to run the database setup
async function fixSupabase() {
  console.log('Starting Supabase fix...');
  
  try {
    console.log('Connected to Supabase at:', SUPABASE_URL);
    
    // Fix tables and insert sample data if needed
    await fixProducts();
    await fixOrders();
    await fixOrderItems();
    await fixStockAdjustments();
    
    console.log('Supabase database successfully fixed and populated with sample data!');
    console.log('Your database should now be back to its original state.');
  } catch (error) {
    console.error('Error fixing Supabase database:', error);
  }
}

// Run the fix function
fixSupabase(); 
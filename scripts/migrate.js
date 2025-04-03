import pg from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const { Pool } = pg;

// SQL statements to execute
const migrations = [
  // Create stock_adjustments table
  `CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('in', 'out')),
    reason TEXT NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT valid_new_quantity CHECK (new_quantity >= 0)
  );

  CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
  CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at DESC);`,

  // Drop existing triggers and constraints
  `DROP TRIGGER IF EXISTS product_deletion_trigger ON products;
   DROP TRIGGER IF EXISTS copy_product_details_trigger ON order_items;
   ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;`,

  // Allow NULL values in product_id column
  `ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;`,

  // Create a function to handle product deletion
  `CREATE OR REPLACE FUNCTION handle_product_deletion()
   RETURNS TRIGGER AS $$
   DECLARE
       product_details RECORD;
   BEGIN
       -- Get the product details before deletion
       SELECT * INTO product_details FROM products WHERE id = OLD.id;
       
       -- Update all order items that reference this product
       UPDATE order_items
       SET product_name = product_details.name || ' (Deleted)',
           product_description = product_details.description,
           product_category = product_details.category,
           product_location = product_details.location,
           product_sku = product_details.sku,
           product_id = NULL
       WHERE product_id = OLD.id;
       
       RETURN OLD;
   END;
   $$ LANGUAGE plpgsql;`,

  // Create AFTER DELETE trigger for products
  `CREATE TRIGGER product_deletion_trigger
   AFTER DELETE ON products
   FOR EACH ROW
   EXECUTE FUNCTION handle_product_deletion();`,

  // Update the copy_product_details function
  `CREATE OR REPLACE FUNCTION copy_product_details() 
   RETURNS TRIGGER AS $$
   BEGIN
       -- For existing products, copy their details
       IF NEW.product_id IS NOT NULL THEN
           SELECT 
               name,
               description,
               category,
               location,
               sku
           INTO 
               NEW.product_name,
               NEW.product_description,
               NEW.product_category,
               NEW.product_location,
               NEW.product_sku
           FROM products
           WHERE id = NEW.product_id;
       END IF;
       
       NEW.product_unit := 'unit';
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;`,

  // Create trigger for new order items
  `CREATE TRIGGER copy_product_details_trigger
   BEFORE INSERT ON order_items
   FOR EACH ROW
   EXECUTE FUNCTION copy_product_details();`,

  // Add back the foreign key with ON DELETE SET NULL
  `ALTER TABLE order_items
   ADD CONSTRAINT order_items_product_id_fkey 
   FOREIGN KEY (product_id) 
   REFERENCES products(id) 
   ON DELETE SET NULL;`,

  // Update existing order items that have NULL product_id
  `UPDATE order_items oi
   SET product_name = COALESCE(p.name || ' (Deleted)', product_name),
       product_description = COALESCE(p.description, product_description),
       product_category = COALESCE(p.category, product_category),
       product_location = COALESCE(p.location, product_location),
       product_sku = COALESCE(p.sku, product_sku)
   FROM products p
   WHERE oi.product_id IS NULL
   AND p.id = oi.product_id;`
];

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log('Connecting to database...');

  try {
    const client = await pool.connect();
    console.log('Successfully connected to database');

    try {
      // Start a transaction
      console.log('Starting transaction...');
      await client.query('BEGIN');

      // Execute each migration statement
      for (let i = 0; i < migrations.length; i++) {
        console.log(`Executing migration ${i + 1}/${migrations.length}...`);
        await client.query(migrations[i]);
      }

      // Commit the transaction
      console.log('Committing transaction...');
      await client.query('COMMIT');
      
      console.log('Migration completed successfully!');
    } catch (error) {
      // Rollback on error
      console.error('Error during migration:', error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release the client
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

console.log('Starting migration process...');
runMigration();
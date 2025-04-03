-- InventoryPro Database Rebuild Script
-- Generated on: 2025-03-31T02:31:44.025Z

-- Start of 20240330_reset_schema.sql
-- Drop existing tables if they exist
DROP TABLE IF EXISTS stock_adjustments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create products table
CREATE TABLE products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    cost_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    value DECIMAL(10, 2) GENERATED ALWAYS AS (stock * cost_price) STORED,
    location VARCHAR(255) NOT NULL,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create orders table
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    customer VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_items INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create order_items table
CREATE TABLE order_items (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(255) REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL,
    product_name TEXT,
    product_description TEXT,
    product_category TEXT,
    product_location TEXT,
    product_sku TEXT,
    product_unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(order_id, product_id)
);

-- Create stock_adjustments table
CREATE TABLE stock_adjustments (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    adjustment_type VARCHAR(3) NOT NULL CHECK (adjustment_type IN ('in', 'out')),
    reason TEXT NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create function to update product updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_adjustments_updated_at
    BEFORE UPDATE ON stock_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to copy product details when creating order items
CREATE OR REPLACE FUNCTION copy_product_details()
RETURNS TRIGGER AS $$
BEGIN
    SELECT 
        name,
        description,
        category,
        location,
        sku,
        'unit'
    INTO
        NEW.product_name,
        NEW.product_description,
        NEW.product_category,
        NEW.product_location,
        NEW.product_sku,
        NEW.product_unit
    FROM products
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically copy product details
CREATE TRIGGER copy_product_details_trigger
    BEFORE INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION copy_product_details();

-- Insert sample products
INSERT INTO products (id, name, description, sku, category, stock, cost_price, selling_price, location, reorder_level)
VALUES 
    ('PRD-20240329000001-001', 'Wireless Mouse', 'MX Master 3', 'WM-001', 'Electronics', 42, 69.99, 99.99, 'Warehouse A, A12', 10),
    ('PRD-20240329000002-001', 'Mechanical Keyboard', 'Keychron K2', 'KB-002', 'Electronics', 5, 104.99, 149.99, 'Warehouse B, B05', 10),
    ('PRD-20240329000003-001', '24" Monitor', 'Dell UltraSharp', 'MON-003', 'Electronics', 0, 209.99, 299.99, 'Warehouse A, A08', 5),
    ('PRD-20240329000004-001', 'Office Chair', 'Ergonomic Pro', 'FRN-004', 'Furniture', 12, 139.99, 199.99, 'Warehouse C, C15', 5),
    ('PRD-20240329000005-001', 'Notebook', 'A4 Lined', 'STN-005', 'Stationery', 156, 3.49, 4.99, 'Warehouse B, B22', 50);

-- Insert sample orders
INSERT INTO orders (id, customer, status, total_items, total_amount)
VALUES
    ('ORD-20240329000001-001', 'John Smith', 'delivered', 2, 249.98),
    ('ORD-20240329000002-001', 'Jane Doe', 'processing', 1, 299.99),
    ('ORD-20240329000003-001', 'Bob Johnson', 'pending', 3, 454.97);

-- Insert sample order items
INSERT INTO order_items (id, order_id, product_id, quantity, price)
VALUES
    ('ORI-20240329000001-001', 'ORD-20240329000001-001', 'PRD-20240329000001-001', 1, 99.99),
    ('ORI-20240329000001-002', 'ORD-20240329000001-001', 'PRD-20240329000002-001', 1, 149.99),
    ('ORI-20240329000002-001', 'ORD-20240329000002-001', 'PRD-20240329000003-001', 1, 299.99),
    ('ORI-20240329000003-001', 'ORD-20240329000003-001', 'PRD-20240329000004-001', 2, 399.98),
    ('ORI-20240329000003-002', 'ORD-20240329000003-001', 'PRD-20240329000005-001', 11, 54.99);

-- Insert sample stock adjustments
INSERT INTO stock_adjustments (id, product_id, quantity, adjustment_type, reason, previous_quantity, new_quantity)
VALUES
    ('ADJ-20240329000001-001', 'PRD-20240329000001-001', 5, 'in', 'Restocking', 37, 42),
    ('ADJ-20240329000002-001', 'PRD-20240329000002-001', 2, 'out', 'Damaged items', 7, 5),
    ('ADJ-20240329000003-001', 'PRD-20240329000003-001', 3, 'in', 'Initial stock', 0, 3); 
-- End of 20240330_reset_schema.sql

-- Start of 20240327001000_add_product_icon_columns.sql
-- Add custom icon columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS custom_icon text,
ADD COLUMN IF NOT EXISTS custom_icon_type text CHECK (custom_icon_type IN ('default', 'custom')); 
-- End of 20240327001000_add_product_icon_columns.sql

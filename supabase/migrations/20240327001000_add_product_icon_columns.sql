-- Add custom icon columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS custom_icon text,
ADD COLUMN IF NOT EXISTS custom_icon_type text CHECK (custom_icon_type IN ('default', 'custom')); 
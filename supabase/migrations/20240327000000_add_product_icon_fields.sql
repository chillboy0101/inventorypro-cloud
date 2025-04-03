-- Add custom icon fields to products table
ALTER TABLE products
ADD COLUMN custom_icon text,
ADD COLUMN custom_icon_type text CHECK (custom_icon_type IN ('default', 'custom')); 
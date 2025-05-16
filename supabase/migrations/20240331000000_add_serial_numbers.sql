-- Add serial number support to products
ALTER TABLE products
ADD COLUMN is_serialized BOOLEAN NOT NULL DEFAULT false;

-- Create serial_numbers table
CREATE TABLE serial_numbers (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    serial_number VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'allocated', 'sold', 'returned', 'damaged')),
    order_id VARCHAR(255) REFERENCES orders(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(product_id, serial_number)
);

-- Create index for faster lookups
CREATE INDEX idx_serial_numbers_product_id ON serial_numbers(product_id);
CREATE INDEX idx_serial_numbers_status ON serial_numbers(status);

-- Create trigger for updated_at
CREATE TRIGGER update_serial_numbers_updated_at
    BEFORE UPDATE ON serial_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
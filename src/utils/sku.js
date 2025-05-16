import { supabase } from '../lib/supabase';
export const generateSKU = async (productName) => {
    // Convert product name to uppercase and remove special characters
    const base = productName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 3);
    // Get current date components
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    // Get count of products for this month to generate sequence
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
    const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);
    // Generate sequence number (padded to 4 digits)
    const sequence = ((count || 0) + 1).toString().padStart(4, '0');
    // Combine all parts: BASE-YYMM-SEQUENCE
    const sku = `${base}-${year}${month}-${sequence}`;
    return sku;
};

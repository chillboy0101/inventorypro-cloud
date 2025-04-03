import type { Database } from '../types/supabase';

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  location: string;
  stock: number;
  reorder_level: number;
  cost_price?: number;
  selling_price?: number;
  custom_icon?: string | null; // URL for custom uploaded image
  custom_icon_type?: 'default' | 'custom' | null; // Whether to use default category icon or custom image
  created_at: string;
  updated_at: string;
  last_adjustment?: {
    quantity: number;
    type: 'add' | 'subtract';
    reason: string;
    timestamp: string;
  };
}

export type ProductInsert = Database['public']['Tables']['products']['Insert'];

export type Order = Database['public']['Tables']['orders']['Row'] & {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customer: string;
  total_items: number;
  total_amount: number;
  created_at: string;
};

export type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  // Additional fields stored in the database for product details
  product_name?: string;
  product_description?: string;
  product_category?: string;
  product_location?: string;
  product_sku?: string;
  product_unit?: string;
};

export type StockAdjustment = Database['public']['Tables']['stock_adjustments']['Row'];

export interface OrdersState {
  items: Order[];
  loading: boolean;
  error: string | null;
  selectedOrder: Order | null;
}

export interface InventoryState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

export interface StockAdjustmentsState {
  items: StockAdjustment[];
  loading: boolean;
  error: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Manager' | 'Staff';
  lastActive: string;
  avatar?: string;
}

export interface SettingsState {
  currency: string;
  darkMode: boolean;
  notifications: boolean;
  userName: string;
  userEmail: string;
  profileImage?: string; // Base64 string of profile image or URL
  companyName: string; // Company name for the inventory system
  itemsPerPage: number;
  orderItemsPerPage?: number;
  inventoryItemsPerPage?: number;
  // Inventory specific settings
  lowStockThreshold: number; // Threshold for low stock warnings
  defaultCategory: string; // Default category for new items
  autoGenerateSKU: boolean; // Automatically generate SKU for new products
  enableBarcodeScanning: boolean; // Enable barcode scanning feature
  valuationMethod: 'FIFO' | 'LIFO' | 'Average Cost' | 'Specific Identification'; // Inventory valuation method
}
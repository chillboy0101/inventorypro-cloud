export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  quantity: number;
  minimum_quantity: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  supplier: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_items: number;
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface StockAdjustment {
  id: string;
  product_id: string;
  quantity: number;
  type: 'in' | 'out';
  reason: string;
  created_at: string;
  product?: Product;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
} 
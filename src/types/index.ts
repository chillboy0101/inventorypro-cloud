export interface Product {
  id?: string;
  name: string;
  description?: string | null;
  sku: string;
  category: string;
  stock?: number;
  cost_price?: number;
  selling_price?: number;
  minimum_quantity?: number;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  product_id: string;
  quantity: number;
  price: number;
  order_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id?: string;
  customer_name: string;
  customer_email?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  items: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

export interface StockAdjustment {
  id?: string;
  product_id: string;
  quantity: number;
  adjustment_type: 'in' | 'out';
  reason: string;
  previous_quantity: number;
  new_quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

export interface OrdersState {
  items: Order[];
  loading: boolean;
  error: string | null;
}

export interface StockAdjustmentsState {
  items: StockAdjustment[];
  loading: boolean;
  error: string | null;
}

export interface RootState {
  products: ProductsState;
  orders: OrdersState;
  stockAdjustments: StockAdjustmentsState;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
} 
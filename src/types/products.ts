export interface Product {
  id?: string;
  name: string;
  sku: string;
  description?: string | null;
  category: string;
  quantity?: number;
  cost_price: number;
  selling_price: number;
  location: string;
  minimum_quantity: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductState {
  products: Product[];
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

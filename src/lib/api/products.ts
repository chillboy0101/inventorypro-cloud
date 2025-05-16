import { BaseApi } from './base';
import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];

export class ProductsApi extends BaseApi<'products'> {
  constructor() {
    super('products');
  }

  async create(record: ProductInsert) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(record)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No data returned from Supabase');
      }

      return data;
    } catch (err) {
      console.error('Create product error:', err);
      throw err;
    }
  }

  async getLowStock() {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .lte('stock', 'reorder_level')
      .order('stock', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getOutOfStock() {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('stock', 0);

    if (error) throw error;
    return data;
  }

  async search(query: string) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  async updateStock(id: string, amount: number, type: 'in' | 'out', reason: string) {
    const { data: product } = await this.getById(id);
    if (!product) throw new Error('Product not found');

    const newStock = type === 'in' 
      ? product.stock + amount
      : product.stock - amount;

    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    const { error: adjustmentError } = await supabase
      .from('stock_adjustments')
      .insert({
        product_id: id,
        quantity: amount,
        type,
        reason
      });

    if (adjustmentError) throw adjustmentError;

    return this.update(id, { stock: newStock });
  }

  async getBySku(sku: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', sku)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (err) {
      console.error('Get product by SKU error:', err);
      throw err;
    }
  }
}

export const productsApi = new ProductsApi(); 
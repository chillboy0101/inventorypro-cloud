import { BaseApi } from './base';
import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

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
      .lte('quantity', 'minimum_quantity')
      .order('quantity', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getOutOfStock() {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('quantity', 0);

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

  async updateStock(id: string, quantity: number, type: 'in' | 'out', reason: string) {
    const { data: product } = await this.getById(id);
    if (!product) throw new Error('Product not found');

    const newQuantity = type === 'in' 
      ? product.quantity + quantity
      : product.quantity - quantity;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }

    const { error: adjustmentError } = await supabase
      .from('stock_adjustments')
      .insert({
        product_id: id,
        quantity,
        type,
        reason
      });

    if (adjustmentError) throw adjustmentError;

    return this.update(id, { quantity: newQuantity });
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
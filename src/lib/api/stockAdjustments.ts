import { BaseApi } from './base';
import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';

type StockAdjustment = Database['public']['Tables']['stock_adjustments']['Row'];
type StockAdjustmentInsert = Database['public']['Tables']['stock_adjustments']['Insert'];
type StockAdjustmentUpdate = Database['public']['Tables']['stock_adjustments']['Update'];

export class StockAdjustmentsApi extends BaseApi<'stock_adjustments'> {
  constructor() {
    super('stock_adjustments');
  }

  async getWithProducts() {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        product: products (
          name,
          sku,
          quantity,
          minimum_quantity
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createAdjustment(adjustment: StockAdjustmentInsert) {
    // Get the current product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', adjustment.product_id)
      .single();

    if (productError) throw productError;
    if (!product) throw new Error('Product not found');

    // Calculate new quantity
    const newQuantity = adjustment.type === 'in'
      ? product.quantity + adjustment.quantity
      : product.quantity - adjustment.quantity;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }

    // Create the adjustment record
    const { data: newAdjustment, error: adjustmentError } = await supabase
      .from(this.table)
      .insert(adjustment)
      .select()
      .single();

    if (adjustmentError) throw adjustmentError;

    // Update product quantity
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', adjustment.product_id);

    if (updateError) {
      // Rollback adjustment creation if product update fails
      await this.delete(newAdjustment.id);
      throw updateError;
    }

    return this.getWithProducts().then(adjustments => 
      adjustments.find(a => a.id === newAdjustment.id)
    );
  }

  async getByProduct(productId: string) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        product: products (
          name,
          sku,
          quantity,
          minimum_quantity
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        product: products (
          name,
          sku,
          quantity,
          minimum_quantity
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getByType(type: 'in' | 'out') {
    const { data, error } = await supabase
      .from(this.table)
      .select(`
        *,
        product: products (
          name,
          sku,
          quantity,
          minimum_quantity
        )
      `)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}

export const stockAdjustmentsApi = new StockAdjustmentsApi(); 
import { BaseApi } from './base';
import type { Database } from '../../types/supabase';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

export class OrdersApi extends BaseApi<'orders'> {
  constructor() {
    super('orders');
  }

  async getWithItems() {
    console.log('Fetching orders with items...');
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            price,
            product:products (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw new Error('Failed to fetch orders');
      }

      console.log(`Successfully fetched ${data?.length || 0} orders`);
      return data || [];
    } catch (error) {
      console.error('Error in getWithItems:', error);
      throw error;
    }
  }

  async createWithItems(
    order: Omit<OrderInsert, 'total_items' | 'total_amount'>,
    items: Array<{ product_id: string; quantity: number; price: number }>
  ) {
    console.log('Creating new order with items:', { order, items });
    try {
      // Calculate totals
      const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
      const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

      // Start a transaction
      const { data: orderData, error: orderError } = await this.supabase
        .from('orders')
        .insert([{ ...order, total_items, total_amount }])
        .select()
        .single();

      if (orderError || !orderData) {
        console.error('Error creating order:', orderError);
        throw new Error('Failed to create order');
      }

      console.log('Order created successfully:', orderData);

      // Insert order items
      const orderItems: OrderItemInsert[] = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await this.supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Try to delete the order since items failed
        await this.supabase
          .from('orders')
          .delete()
          .eq('id', orderData.id);
        throw new Error('Failed to create order items');
      }

      console.log('Order items created successfully');

      // Fetch the complete order with items
      const { data: completeOrder, error: fetchError } = await this.supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            price,
            product:products (*)
          )
        `)
        .eq('id', orderData.id)
        .single();

      if (fetchError || !completeOrder) {
        console.error('Error fetching complete order:', fetchError);
        throw new Error('Failed to fetch complete order');
      }

      console.log('Complete order fetched successfully:', completeOrder);
      return completeOrder;
    } catch (error) {
      console.error('Error in createWithItems:', error);
      throw error;
    }
  }

  async updateStatus(id: string, status: OrderRow['status']) {
    console.log('Updating order status:', { id, status });
    try {
      // First update the status
      const { error: updateError } = await this.supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating order status:', updateError);
        throw new Error('Failed to update order status');
      }

      console.log('Order status updated successfully');

      // Then fetch the complete order with items and products
      const { data, error } = await this.supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            price,
            product:products (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching updated order:', error);
        throw new Error('Failed to fetch updated order');
      }

      console.log('Updated order fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in updateStatus:', error);
      throw error;
    }
  }

  async getByDateRange(startDate: Date, endDate: Date) {
    console.log('Fetching orders by date range:', { startDate, endDate });
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders by date range:', error);
        throw new Error('Failed to fetch orders by date range');
      }

      console.log(`Successfully fetched ${data?.length || 0} orders in date range`);
      return data || [];
    } catch (error) {
      console.error('Error in getByDateRange:', error);
      throw error;
    }
  }

  async getByStatus(status: OrderRow['status']) {
    console.log('Fetching orders by status:', status);
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders by status:', error);
        throw new Error('Failed to fetch orders by status');
      }

      console.log(`Successfully fetched ${data?.length || 0} orders with status ${status}`);
      return data || [];
    } catch (error) {
      console.error('Error in getByStatus:', error);
      throw error;
    }
  }
}

export const ordersApi = new OrdersApi(); 
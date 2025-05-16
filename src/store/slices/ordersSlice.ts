import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem, OrdersState, Product } from '../types';
import { fetchProducts } from './inventorySlice';

interface OrderWithItems extends Order {
  items: (OrderItem & {
    product?: Product;
  })[];
}

const initialState: OrdersState = {
  items: [],
  loading: false,
  error: null,
  selectedOrder: null,
};

type OrderStatus = Order['status'];
type StatusTransitions = {
  [K in OrderStatus]: OrderStatus[];
};

const STATUS_FLOW: StatusTransitions = {
  'pending': ['processing', 'cancelled'],
  'processing': ['shipped', 'cancelled'],
  'shipped': ['delivered', 'cancelled'],
  'delivered': [], // End state
  'cancelled': [], // End state
};

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async () => {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Fetch order items with their product details
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*, product:products(*)');

    if (itemsError) throw itemsError;

    // Map the orders with their items
    return orders.map((order) => ({
      ...order,
      items: items
        .filter((item) => item.order_id === order.id)
        .map((item) => ({
          ...item,
          product: item.product || {
            id: item.product_id,
            name: 'Deleted Product',
            description: 'This product has been deleted',
            category: 'N/A',
            location: 'N/A',
            sku: 'N/A',
            unit: 'N/A'
          }
        })),
    }));
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: {
    customer: string;
    total_items: number;
    total_amount: number;
    status: Order['status'];
    items: Array<{
      product_id: string;
      quantity: number;
      price: number;
      serial_numbers?: string[];
      product?: Product;
    }>;
  }, { dispatch, rejectWithValue }) => {
    // Validate stock levels first
    for (const item of orderData.items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (productError) throw productError;
      if (!product) throw new Error(`Product ${item.product_id} not found`);

      if (product.stock < item.quantity) {
        return rejectWithValue(`Insufficient stock for product ${item.product_id}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
    }

    // Generate a timestamp-based ID in format: YYYYMMDDHHMMSS
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Create timestamp and random suffix
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Generate IDs
    const orderId = `ORD-${timestamp}-${randomSuffix}`;

    // Create the order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        id: orderId,
        customer: orderData.customer,
        total_items: orderData.total_items,
        total_amount: orderData.total_amount,
        status: orderData.status,
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Then, create the order items and update product stock
    if (orderData.items.length > 0) {
      const items = orderData.items.map((item, index) => ({
        id: `ORI-${timestamp}-${String(index + 1).padStart(3, '0')}`,
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      // Update product stock levels
      for (const item of orderData.items) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (productError) throw productError;

        const newStock = product.stock - item.quantity;
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);

        if (updateError) throw updateError;
      }

      const { data: newItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(items)
        .select('*, product:products(*)');

      if (itemsError) throw itemsError;

      // Refresh products after stock update
      await dispatch(fetchProducts());

      // After inserting order_items, before returning:
      if (orderData.items.some(item => item.serial_numbers && item.serial_numbers.length > 0)) {
        for (const item of orderData.items) {
          if (item.serial_numbers && item.serial_numbers.length > 0) {
            await supabase.from('serial_numbers')
              .update({ status: 'sold', order_id: orderId })
              .in('id', item.serial_numbers);
          }
        }
      }

      // Return the order with its items
      return {
        ...newOrder,
        items: newItems,
      };
    }

    return {
      ...newOrder,
      items: [],
    };
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }: { id: string; status: OrderStatus }, { rejectWithValue, dispatch }) => {
    // First get the current order to check status
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('status, order_items(product_id, quantity)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!currentOrder) throw new Error('Order not found');

    const currentStatus = currentOrder.status as OrderStatus;
    // Validate status transition
    const allowedNextStatuses = STATUS_FLOW[currentStatus];
    if (!allowedNextStatuses.includes(status)) {
      return rejectWithValue(
        `Invalid status transition. Order cannot go from ${currentStatus} to ${status}. ` +
        `Allowed transitions: ${allowedNextStatuses.join(', ')}`
      );
    }

    // If order is being cancelled, restore the stock
    if (status === 'cancelled' && currentStatus !== 'cancelled') {
      for (const item of currentOrder.order_items) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (productError) throw productError;

        const newStock = product.stock + item.quantity;
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);

        if (updateError) throw updateError;
      }

      // Restore serial numbers for this order
      const { error: serialsError } = await supabase
        .from('serial_numbers')
        .update({ status: 'available', order_id: null })
        .eq('order_id', id)
        .eq('status', 'sold');
      if (serialsError) throw serialsError;

      // Refresh products after stock update
      await dispatch(fetchProducts());
    }

    // Update the order status
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Fetch the updated order with its items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*, product:products(*)')
      .eq('order_id', id);

    if (itemsError) throw itemsError;

    return {
      ...data,
      items,
    };
  }
);

export const deleteOrder = createAsyncThunk(
  'orders/deleteOrder',
  async (id: string) => {
    // Get the order items to find potential ghost products
    const { data: orderItems, error: fetchError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    if (fetchError) throw fetchError;

    // Delete all order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);

    if (itemsError) throw itemsError;

    // Delete the order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Clean up ghost products if they're no longer referenced in any orders
    if (orderItems && orderItems.length > 0) {
      // Get all potential ghost product IDs from this order
      const potentialGhostProductIds = orderItems
        .map(item => item.product_id)
        .filter(id => id && id.startsWith('GHOST-'));

      if (potentialGhostProductIds.length > 0) {
        // For each ghost product, check if it's used in any other orders
        for (const ghostId of potentialGhostProductIds) {
          // Check if this ghost product is referenced in any other order items
          const { data: otherReferences, error: refError } = await supabase
            .from('order_items')
            .select('id')
            .eq('product_id', ghostId)
            .neq('order_id', id); // Exclude the order we're deleting
          
          if (refError) {
            console.error(`Error checking references for ghost product ${ghostId}:`, refError);
            continue;
          }

          // If no other orders reference this ghost product, we can safely delete it
          if (!otherReferences || otherReferences.length === 0) {
            const { error: deleteError } = await supabase
              .from('products')
              .delete()
              .eq('id', ghostId);
            
            if (deleteError) {
              console.error(`Error deleting ghost product ${ghostId}:`, deleteError);
            } else {
              console.log(`Ghost product ${ghostId} deleted successfully`);
            }
          }
        }
      }
    }

    return id;
  }
);

export const clearAllOrders = createAsyncThunk(
  'orders/clearAllOrders',
  async () => {
    // First, identify ghost products to clean up later
    const { data: ghostProducts, error: ghostError } = await supabase
      .from('products')
      .select('id')
      .like('id', 'GHOST-%');

    if (ghostError) {
      console.error('Error fetching ghost products:', ghostError);
    }

    // Delete all order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .neq('id', ''); // Delete all records

    if (itemsError) throw itemsError;

    // Delete all orders
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', ''); // Delete all records

    if (ordersError) throw ordersError;
    
    // Since all orders are deleted, we can safely delete all ghost products
    if (ghostProducts && ghostProducts.length > 0) {
      const ghostIds = ghostProducts.map(p => p.id);
      
      const { error: deleteGhostsError } = await supabase
        .from('products')
        .delete()
        .in('id', ghostIds);
      
      if (deleteGhostsError) {
        console.error('Error deleting ghost products:', deleteGhostsError);
      } else {
        console.log(`Successfully deleted ${ghostIds.length} ghost products`);
      }
    }

    return [];
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<OrderWithItems[]>) => {
      state.items = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSelectedOrder: (state, action: PayloadAction<Order | null>) => {
      state.selectedOrder = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      // Create Order
      .addCase(createOrder.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (o) => o.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete Order
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.items = state.items.filter(o => o.id !== action.payload);
        if (state.selectedOrder?.id === action.payload) {
          state.selectedOrder = null;
        }
      })
      // Clear All Orders
      .addCase(clearAllOrders.fulfilled, (state) => {
        state.items = [];
        state.selectedOrder = null;
      });
  },
});

export const { setOrders, setLoading, setError, setSelectedOrder } = ordersSlice.actions;
export default ordersSlice.reducer; 
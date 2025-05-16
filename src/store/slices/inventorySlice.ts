import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import type { Product } from '../types';

type ProductInsert = Database['public']['Tables']['products']['Insert'];

interface InventoryState {
  items: Product[];
  categories: string[];
  locations: string[];
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  items: [],
  categories: [],
  locations: [],
  loading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk(
  'inventory/fetchCategories',
  async () => {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)
      .not('id', 'like', 'GHOST-%')
      .not('name', 'like', '[DELETED]%')
      .not('sku', 'like', 'DELETED-%');

    if (error) throw error;
    const uniqueCategories = [...new Set(data.map(item => item.category))];
    return uniqueCategories.sort();
  }
);

export const fetchLocations = createAsyncThunk(
  'inventory/fetchLocations',
  async () => {
    const { data, error } = await supabase
      .from('products')
      .select('location')
      .not('location', 'is', null)
      .not('id', 'like', 'GHOST-%')
      .not('name', 'like', '[DELETED]%')
      .not('sku', 'like', 'DELETED-%');

    if (error) throw error;
    const uniqueLocations = [...new Set(data.map(item => item.location))];
    return uniqueLocations.sort();
  }
);

export const fetchProducts = createAsyncThunk(
  'inventory/fetchProducts',
  async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
);

export const updateProduct = createAsyncThunk(
  'inventory/updateProduct',
  async (updates: Partial<Product> & { id: string }) => {
    const { id, ...rest } = updates;  // Just extract id and use rest for updates
    // Remove adjustment_reason from the product update payload
    const { adjustment_reason, ...productUpdates } = rest;

    // First get the current product
    const { data: currentProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!currentProduct) throw new Error('Product not found');

    // If stock is being updated for a serialized product
    if (currentProduct.is_serialized && rest.stock !== undefined) {
      // Get current available serial numbers
      const { data: availableSerials, error: serialsError } = await supabase
        .from('serial_numbers')
        .select('id')
        .eq('product_id', id)
        .eq('status', 'available');

      if (serialsError) throw serialsError;

      const currentAvailableCount = availableSerials?.length || 0;

      // If reducing stock, ensure we have enough serials to remove
      if (rest.stock < currentAvailableCount) {
        throw new Error(`Cannot reduce stock below ${currentAvailableCount} (number of available serial numbers)`);
      }

      // If increasing stock, we need to add serial numbers
      if (rest.stock > currentAvailableCount) {
        throw new Error('Please use the Serial Number Manager to add new serial numbers');
      }
    }

    // Update the product
    const { data, error } = await supabase
      .from('products')
      .update(productUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If stock was updated, create a stock adjustment record
    if (rest.stock !== undefined && rest.stock !== currentProduct.stock) {
      const adjustmentType = rest.stock > currentProduct.stock ? 'in' : 'out';
      const adjustmentQuantity = Math.abs(rest.stock - currentProduct.stock);

      // Get the last stock adjustment ID
      const { data: lastAdjustment, error: lastAdjError } = await supabase
        .from('stock_adjustments')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      if (lastAdjError) {
        throw new Error(`Failed to fetch last adjustment: ${lastAdjError.message}`);
      }

      // Generate next adjustment ID
      let nextAdjId = 1001;
      if (lastAdjustment && lastAdjustment.length > 0) {
        const lastId = lastAdjustment[0].id;
        const lastNumber = parseInt(lastId.split('-')[1]);
        nextAdjId = isNaN(lastNumber) ? 1001 : lastNumber + 1;
      }

      const { error: adjustmentError } = await supabase
        .from('stock_adjustments')
        .insert({
          id: `ADJ-${nextAdjId}`,
          product_id: id,
          quantity: adjustmentQuantity,
          adjustment_type: adjustmentType,
          reason: adjustment_reason || 'Manual stock update',
          previous_quantity: currentProduct.stock,
          new_quantity: rest.stock
        });

      if (adjustmentError) {
        // If stock adjustment fails, rollback the product update
        await supabase
          .from('products')
          .update({ stock: currentProduct.stock })
          .eq('id', id);
        throw new Error(`Failed to create stock adjustment: ${adjustmentError.message}`);
      }
    }

    return data;
  }
);

export const deleteProduct = createAsyncThunk(
  'inventory/deleteProduct',
  async (id: string) => {
    try {
      // First check if this product is used in any orders
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('id, order_id, product_name, product_sku')
        .eq('product_id', id);
      
      if (orderItemsError) {
        console.error('Error fetching order items:', orderItemsError);
        throw new Error('Failed to check if product is referenced in orders');
      }

      // If product is used in orders
      if (orderItems && orderItems.length > 0) {
        // Get current product details before deleting
        const { data: productData, error: productFetchError } = await supabase
          .from('products')
          .select('name, description, sku, category')
          .eq('id', id)
          .single();
          
        if (productFetchError) {
          console.error('Error fetching product details:', productFetchError);
          throw new Error('Failed to fetch product details');
        }
        
        // Create a unique timestamp-based ID and SKU for the ghost product
        const timestamp = Date.now();
        const ghostId = `GHOST-${id}-${timestamp}`;
        const ghostSku = `DELETED-${timestamp}-${productData.sku?.substring(0, 10) || 'SKU'}`;
        
        // Create a "ghost product" to maintain references
        const { error: createGhostError } = await supabase
          .from('products')
          .insert({
            id: ghostId,
            name: `[DELETED] ${productData.name || 'Unknown Product'}`,
            description: `This product was deleted on ${new Date().toLocaleString()}. Preserved for order history.`,
            sku: ghostSku,
            category: productData.category || 'Deleted Products',
            location: 'Archive',
            stock: 0,
            reorder_level: 0,
            cost_price: 0,
            selling_price: 0
          });
          
        if (createGhostError) {
          console.error('Error creating ghost product:', createGhostError);
          throw new Error('Failed to create reference for order history');
        }
        
        // Update order_items to reference the ghost product
        for (const item of orderItems) {
          const { error: updateError } = await supabase
            .from('order_items')
            .update({ product_id: ghostId })
            .eq('id', item.id);
            
          if (updateError) {
            console.error('Error updating order item:', updateError);
            throw new Error('Failed to update order references');
          }
        }
      }
      
      // Delete stock adjustments for this product
      const { error: adjustmentsError } = await supabase
        .from('stock_adjustments')
        .delete()
        .eq('product_id', id);
      
      if (adjustmentsError) {
        console.error('Error deleting stock adjustments:', adjustmentsError);
      }

      // Finally, delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (productError) {
        console.error('Error deleting product:', productError);
        throw productError;
      }

      return id;
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  }
);

export const createProduct = createAsyncThunk(
  'inventory/createProduct',
  async (product: ProductInsert) => {
    // First, try to get the schema by making a select query
    const { error: schemaError } = await supabase
      .from('products')
      .select('cost_price')
      .limit(0);

    if (schemaError) {
      console.error('Schema error:', schemaError);
      throw new Error('Failed to validate schema. Please try again.');
    }

    // Generate a product ID with 'PRD-' prefix and a 4-digit number
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    let nextId = 1001; // Start with 1001 if no products exist
    if (existingProducts && existingProducts.length > 0) {
      const lastId = existingProducts[0].id;
      const lastNumber = parseInt(lastId.split('-')[1]);
      nextId = isNaN(lastNumber) ? 1001 : lastNumber + 1;
    }

    const productWithId = {
      id: `PRD-${nextId}`,
      name: product.name,
      description: product.description,
      sku: product.sku,
      category: product.category,
      stock: product.stock,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      location: product.location,
      reorder_level: product.reorder_level || 0,
      is_serialized: product.is_serialized || false
    };

    const { data, error } = await supabase
      .from('products')
      .insert([productWithId])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
);

export const addCategory = createAsyncThunk(
  'inventory/addCategory',
  async (category: string, { getState }) => {
    const state = getState() as { inventory: InventoryState };
    if (state.inventory.categories.includes(category)) {
      return state.inventory.categories;
    }
    return [...state.inventory.categories, category].sort();
  }
);

export const addLocation = createAsyncThunk(
  'inventory/addLocation',
  async (location: string, { getState }) => {
    const state = getState() as { inventory: InventoryState };
    if (state.inventory.locations.includes(location)) {
      return state.inventory.locations;
    }
    return [...state.inventory.locations, location].sort();
  }
);

export const clearAllProducts = createAsyncThunk(
  'inventory/clearAllProducts',
  async () => {
    // First, delete all stock adjustments
    const { error: stockAdjustmentsError } = await supabase
      .from('stock_adjustments')
      .delete()
      .neq('id', ''); // Delete all records

    if (stockAdjustmentsError) {
      console.error('Error deleting stock adjustments:', stockAdjustmentsError);
    }

    // Delete all products
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .neq('id', ''); // Delete all records

    if (productsError) throw productsError;

    return [];
  }
);

export const clearAllInventory = createAsyncThunk(
  'inventory/clearAllInventory',
  async () => {
    try {
      // First, get all products that are referenced in order_items
      const { data: orderProducts, error: orderProductsError } = await supabase
        .from('order_items')
        .select('product_id')
        .not('product_id', 'is', null);
      
      if (orderProductsError) {
        console.error('Error checking order products:', orderProductsError);
        throw orderProductsError;
      }
      
      // Create a set of product IDs used in orders for faster lookup
      const productsInOrders = new Set(orderProducts?.map(item => item.product_id) || []);
      console.log(`Found ${productsInOrders.size} products referenced in orders`);
      
      // For products that are in orders, we'll create ghost products
      for (const productId of productsInOrders) {
        // Get product details
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('name, description, sku, category')
          .eq('id', productId)
          .single();
          
        if (productError) {
          console.error(`Error fetching product ${productId}:`, productError);
          continue;
        }
        
        // Create ghost product with timestamp to ensure unique SKU
        const timestamp = Date.now();
        const ghostId = `GHOST-${productId}-${timestamp}`;
        const ghostSku = `DELETED-${timestamp}-${product.sku?.substring(0, 10) || 'SKU'}`;
        
        // Insert ghost product
        const { error: ghostError } = await supabase
          .from('products')
          .insert({
            id: ghostId,
            name: `[DELETED] ${product.name || 'Unknown Product'}`,
            description: `This product was deleted in bulk on ${new Date().toLocaleString()}. Preserved for order history.`,
            sku: ghostSku,
            category: product.category || 'Deleted Products',
            location: 'Archive',
            stock: 0,
            reorder_level: 0,
            cost_price: 0,
            selling_price: 0
          });
          
        if (ghostError) {
          console.error('Error creating ghost product:', ghostError);
          continue;
        }
        
        // Update order_items to point to ghost product
        const { error: updateError } = await supabase
          .from('order_items')
          .update({ product_id: ghostId })
          .eq('product_id', productId);
          
        if (updateError) {
          console.error('Error updating order items for product:', updateError);
        }
      }
      
      // Delete all stock adjustments
      const { error: stockAdjustmentsError } = await supabase
        .from('stock_adjustments')
        .delete()
        .neq('id', ''); // Delete all records

      if (stockAdjustmentsError) {
        console.error('Error deleting stock adjustments:', stockAdjustmentsError);
      }

      // Delete all products (ghost products will remain but will be filtered from UI)
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .not('id', 'like', 'GHOST-%'); // Don't delete ghost products we just created

      if (productsError) {
        console.error('Error deleting products:', productsError);
        throw productsError;
      }
      
      return true;
    } catch (error) {
      console.error('Clear all inventory error:', error);
      throw error;
    }
  }
);

export const updateProductIcon = createAsyncThunk(
  'inventory/updateProductIcon',
  async ({ productId, iconUrl, iconType }: { productId: string; iconUrl: string | null; iconType: 'default' | 'custom' | null }) => {
    const { error } = await supabase
      .from('products')
      .update({
        custom_icon: iconUrl,
        custom_icon_type: iconType,
      })
      .eq('id', productId);

    if (error) throw error;
    return { productId, iconUrl, iconType };
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateAllProductIcons: (state, action) => {
      state.items = state.items.map(product => ({
        ...product,
        custom_icon: action.payload.iconUrl,
        custom_icon_type: action.payload.iconType,
      }));
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      // Add Category
      .addCase(addCategory.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      // Fetch Locations
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.locations = action.payload;
      })
      // Add Location
      .addCase(addLocation.fulfilled, (state, action) => {
        state.locations = action.payload;
      })
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      // Create Product
      .addCase(createProduct.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // Update Product
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete Product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(p => p.id !== action.payload);
      })
      // Clear All Products
      .addCase(clearAllProducts.fulfilled, (state) => {
        state.items = [];
        state.categories = [];
        state.locations = [];
      })
      // Clear All Inventory
      .addCase(clearAllInventory.fulfilled, (state) => {
        state.items = [];
        state.categories = [];
        state.locations = [];
      })
      // Update Product Icon
      .addCase(updateProductIcon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductIcon.fulfilled, (state, action) => {
        state.loading = false;
        const product = state.items.find(item => item.id === action.payload.productId);
        if (product) {
          product.custom_icon = action.payload.iconUrl;
          product.custom_icon_type = action.payload.iconType;
        }
      })
      .addCase(updateProductIcon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update product icon';
      });
  },
});

export const { setProducts, setLoading, setError, updateAllProductIcons } = inventorySlice.actions;
export default inventorySlice.reducer; 
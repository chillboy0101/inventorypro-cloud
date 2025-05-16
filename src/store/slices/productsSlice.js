import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
const initialState = {
    items: [],
    loading: false,
    error: null,
    selectedProduct: null,
};
// Async thunks
export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data;
});
export const createProduct = createAsyncThunk('products/createProduct', async (product) => {
    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
    if (error)
        throw error;
    return data;
});
export const updateProduct = createAsyncThunk('products/updateProduct', async (product) => {
    const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', product.id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
});
export const deleteProduct = createAsyncThunk('products/deleteProduct', async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error)
        throw error;
    return id;
});
export const updateStock = createAsyncThunk('products/updateStock', async ({ id, quantity, adjustmentType, reason }) => {
    // First get the current product
    const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
    if (fetchError)
        throw fetchError;
    if (!product)
        throw new Error('Product not found');
    // Calculate new quantity
    const newQuantity = adjustmentType === 'in'
        ? product.quantity + quantity
        : product.quantity - quantity;
    // Validate new quantity
    if (newQuantity < 0) {
        throw new Error('Cannot remove more stock than available');
    }
    // Update the product quantity
    const { data, error: updateError } = await supabase
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', id)
        .select()
        .single();
    if (updateError)
        throw updateError;
    // Log the stock adjustment
    const { error: logError } = await supabase
        .from('stock_adjustments')
        .insert([{
            product_id: id,
            quantity,
            adjustment_type: adjustmentType,
            reason,
            previous_quantity: product.quantity,
            new_quantity: newQuantity
        }]);
    if (logError) {
        // If logging fails, rollback the quantity update
        await supabase
            .from('products')
            .update({ quantity: product.quantity })
            .eq('id', id);
        throw logError;
    }
    return data;
});
const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        setSelectedProduct: (state, action) => {
            state.selectedProduct = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
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
            .addCase(createProduct.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(createProduct.fulfilled, (state, action) => {
            state.loading = false;
            state.items.unshift(action.payload);
        })
            .addCase(createProduct.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to create product';
        })
            // Update Product
            .addCase(updateProduct.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(updateProduct.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.items.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.items[index] = action.payload;
            }
        })
            .addCase(updateProduct.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to update product';
        })
            // Delete Product
            .addCase(deleteProduct.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(deleteProduct.fulfilled, (state, action) => {
            state.loading = false;
            state.items = state.items.filter(p => p.id !== action.payload);
            if (state.selectedProduct?.id === action.payload) {
                state.selectedProduct = null;
            }
        })
            .addCase(deleteProduct.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to delete product';
        })
            // Update Stock
            .addCase(updateStock.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(updateStock.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.items.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.items[index] = action.payload;
            }
        })
            .addCase(updateStock.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to update stock';
        });
    },
});
export const { setSelectedProduct, clearError } = productsSlice.actions;
export default productsSlice.reducer;

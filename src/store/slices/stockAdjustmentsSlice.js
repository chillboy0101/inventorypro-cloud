import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
const initialState = {
    items: [],
    loading: false,
    error: null,
};
export const fetchStockAdjustments = createAsyncThunk('stockAdjustments/fetchAll', async () => {
    const { data, error } = await supabase
        .from('stock_adjustments')
        .select('*')
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data;
});
export const createStockAdjustment = createAsyncThunk('stockAdjustments/create', async (adjustment) => {
    const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', adjustment.product_id)
        .single();
    if (!product) {
        throw new Error('Product not found');
    }
    const previous_quantity = product.stock;
    const new_quantity = adjustment.adjustment_type === 'in'
        ? previous_quantity + adjustment.quantity
        : previous_quantity - adjustment.quantity;
    if (new_quantity < 0) {
        throw new Error('Stock cannot be negative');
    }
    // Start a transaction
    const { data: stockAdjustment, error: adjustmentError } = await supabase
        .from('stock_adjustments')
        .insert([{
            ...adjustment,
            previous_quantity,
            new_quantity,
        }])
        .select()
        .single();
    if (adjustmentError)
        throw adjustmentError;
    // Update product stock
    const { error: updateError } = await supabase
        .from('products')
        .update({ stock: new_quantity })
        .eq('id', adjustment.product_id);
    if (updateError)
        throw updateError;
    return stockAdjustment;
});
const stockAdjustmentsSlice = createSlice({
    name: 'stockAdjustments',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchStockAdjustments.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(fetchStockAdjustments.fulfilled, (state, action) => {
            state.loading = false;
            state.items = action.payload;
        })
            .addCase(fetchStockAdjustments.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch stock adjustments';
        })
            .addCase(createStockAdjustment.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(createStockAdjustment.fulfilled, (state, action) => {
            state.loading = false;
            state.items.unshift(action.payload);
        })
            .addCase(createStockAdjustment.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to create stock adjustment';
        });
    },
});
export default stockAdjustmentsSlice.reducer;

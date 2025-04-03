import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './slices/inventorySlice';
import ordersReducer from './slices/ordersSlice';
import productsReducer from './slices/productsSlice';
import stockAdjustmentsReducer from './slices/stockAdjustmentsSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    orders: ordersReducer,
    products: productsReducer,
    stockAdjustments: stockAdjustmentsReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
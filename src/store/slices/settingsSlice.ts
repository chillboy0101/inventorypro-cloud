import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SettingsState } from '../types';

// Load settings from localStorage or use defaults
export const loadSettings = (): SettingsState => {
  try {
    const savedSettings = localStorage.getItem('inventorySettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage', error);
  }
  // Default settings
  return {
    itemsPerPage: 10,
    darkMode: false,
    currency: 'USD',
    notifications: false,
    userName: 'Demo User',
    userEmail: 'demo@example.com',
    profileImage: '',
    companyName: 'InventoryPro',
    orderItemsPerPage: 10,
    inventoryItemsPerPage: 10,
    lowStockThreshold: 5,
    defaultCategory: 'General',
    autoGenerateSKU: true,
    enableBarcodeScanning: true,
    valuationMethod: 'FIFO'
  };
};

const initialState: SettingsState = loadSettings();

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.itemsPerPage = action.payload;
      // Save to localStorage
      try {
        localStorage.setItem('inventorySettings', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    },
    setOrderItemsPerPage: (state, action: PayloadAction<number>) => {
      state.orderItemsPerPage = action.payload;
      // Save to localStorage
      try {
        localStorage.setItem('inventorySettings', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    },
    setInventoryItemsPerPage: (state, action: PayloadAction<number>) => {
      state.inventoryItemsPerPage = action.payload;
      // Save to localStorage
      try {
        localStorage.setItem('inventorySettings', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    },
    updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      // Update all provided settings
      Object.assign(state, action.payload);
      
      // Save to localStorage
      try {
        localStorage.setItem('inventorySettings', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }
  }
});

export const { 
  setItemsPerPage, 
  setOrderItemsPerPage, 
  setInventoryItemsPerPage,
  updateSettings 
} = settingsSlice.actions;
export default settingsSlice.reducer;
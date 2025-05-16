import { createSlice } from '@reduxjs/toolkit';
// Load settings from localStorage or use defaults
export const loadSettings = () => {
    try {
        const savedSettings = localStorage.getItem('inventorySettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
    }
    catch (error) {
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
const initialState = loadSettings();
const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setItemsPerPage: (state, action) => {
            state.itemsPerPage = action.payload;
            // Save to localStorage
            try {
                localStorage.setItem('inventorySettings', JSON.stringify(state));
            }
            catch (error) {
                console.error('Failed to save settings:', error);
            }
        },
        setOrderItemsPerPage: (state, action) => {
            state.orderItemsPerPage = action.payload;
            // Save to localStorage
            try {
                localStorage.setItem('inventorySettings', JSON.stringify(state));
            }
            catch (error) {
                console.error('Failed to save settings:', error);
            }
        },
        setInventoryItemsPerPage: (state, action) => {
            state.inventoryItemsPerPage = action.payload;
            // Save to localStorage
            try {
                localStorage.setItem('inventorySettings', JSON.stringify(state));
            }
            catch (error) {
                console.error('Failed to save settings:', error);
            }
        },
        updateSettings: (state, action) => {
            // Update all provided settings
            Object.assign(state, action.payload);
            // Save to localStorage
            try {
                localStorage.setItem('inventorySettings', JSON.stringify(state));
            }
            catch (error) {
                console.error('Failed to save settings:', error);
            }
        }
    }
});
export const { setItemsPerPage, setOrderItemsPerPage, setInventoryItemsPerPage, updateSettings } = settingsSlice.actions;
export default settingsSlice.reducer;

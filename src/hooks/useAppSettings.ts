import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { formatCurrency } from '../utils/formatters';

/**
 * Custom hook for accessing and using application settings
 * @returns Object containing formatted utility functions and settings
 */
export const useAppSettings = () => {
  const settings = useSelector((state: RootState) => state.settings);
  
  /**
   * Format a number as currency using the application's currency setting
   * @param value The numeric value to format as currency
   * @returns Formatted currency string
   */
  const formatPrice = (value: number): string => {
    return formatCurrency(value, settings.currency || 'USD');
  };
  
  /**
   * Check if a product's quantity is below the low stock threshold
   * @param quantity The current quantity of the product
   * @returns Boolean indicating if the product is low on stock
   */
  const isLowStock = (quantity: number): boolean => {
    return quantity <= (settings.lowStockThreshold || 5);
  };
  
  /**
   * Generate a product SKU based on the user's autoGenerateSKU preference
   * @param productName The name of the product
   * @param category The category of the product (optional)
   * @returns A generated SKU or null if auto-generation is disabled
   */
  const generateProductSKU = (productName: string, category?: string): string | null => {
    if (!settings.autoGenerateSKU) {
      return null;
    }
    
    const prefix = category ? category.substring(0, 3).toUpperCase() : 
      settings.defaultCategory.substring(0, 3).toUpperCase();
    const namePart = productName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${prefix}-${namePart}-${randomNum}`;
  };
  
  return {
    settings,
    formatPrice,
    isLowStock,
    generateProductSKU,
    
    // Settings values for quick access
    isDarkMode: settings.darkMode || false,
    notificationsEnabled: settings.notifications || false,
    companyName: settings.companyName || 'InventoryPro',
    lowStockThreshold: settings.lowStockThreshold || 5,
    defaultCategory: settings.defaultCategory || 'General',
    valuationMethod: settings.valuationMethod || 'FIFO',
    enableBarcodeScanning: settings.enableBarcodeScanning !== false
  };
};

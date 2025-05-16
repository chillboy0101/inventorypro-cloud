/**
 * Utility functions for formatting various data types
 */
/**
 * Format a number as currency according to the provided currency code
 * @param value The numeric value to format
 * @param currencyCode The ISO 4217 currency code (e.g. USD, EUR, GBP)
 * @returns Formatted currency string
 */
export const formatCurrency = (value, currencyCode = 'USD') => {
    // Special handling for Ghana Cedis which may not be supported in all browsers
    if (currencyCode === 'GHS') {
        return `₵${value.toFixed(2)}`;
    }
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode
        }).format(value);
    }
    catch (error) {
        // Fall back to simple formatting if the currency code is not supported
        console.warn(`Currency code ${currencyCode} not supported, using fallback format`);
        return `${currencyCode} ${value.toFixed(2)}`;
    }
};
/**
 * Format a date in a user-friendly format
 * @param date The date to format (Date object or ISO string)
 * @returns Formatted date string
 */
export const formatDate = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};
/**
 * Format a timestamp in a user-friendly format with time
 * @param timestamp The timestamp to format (Date object or ISO string)
 * @returns Formatted timestamp string
 */
export const formatTimestamp = (timestamp) => {
    const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

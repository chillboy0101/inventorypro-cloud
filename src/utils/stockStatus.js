// Shared utility for stock status
export function getStockStatus(stock, reorderLevel, globalThreshold) {
    const effectiveThreshold = reorderLevel > 0 ? reorderLevel : globalThreshold;
    if (stock === 0)
        return 'Out of Stock';
    if (stock <= effectiveThreshold)
        return 'Low Stock';
    return 'In Stock';
}

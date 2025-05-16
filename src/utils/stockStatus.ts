// Shared utility for stock status
export function getStockStatus(stock: number, reorderLevel: number, globalThreshold: number): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  const effectiveThreshold = reorderLevel > 0 ? reorderLevel : globalThreshold;
  if (stock === 0) return 'Out of Stock';
  if (stock <= effectiveThreshold) return 'Low Stock';
  return 'In Stock';
} 
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchProducts, clearAllInventory, updateProduct } from '../store/slices/inventorySlice';
import { setInventoryItemsPerPage } from '../store/slices/settingsSlice';
import UnifiedBarcodeScanner from '../components/UnifiedBarcodeScanner';
import {
  PlusIcon, 
  MagnifyingGlassIcon, 
  ArrowsRightLeftIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Product } from '../store/types';
import InventoryHistory from '../components/InventoryHistory';

const Inventory = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: products, loading, error } = useSelector((state: RootState) => state.inventory);
  const settings = useSelector((state: RootState) => state.settings);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Status');
  const [filterLocation, setFilterLocation] = useState('All Warehouses');
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in');
  const [scanError, setScanError] = useState<string | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    
    // Check if there's a product to adjust from the barcode scanner
    const adjustStockProductJson = localStorage.getItem('adjustStockProduct');
    if (adjustStockProductJson) {
      try {
        const product = JSON.parse(adjustStockProductJson);
        // Clear the localStorage item
        localStorage.removeItem('adjustStockProduct');
        // Set up the adjustment modal
        setSelectedProduct(product);
        setAdjustmentQuantity(0);
        setAdjustmentType('in');
        setAdjustmentReason('');
        setScanError(null);
        setIsAddStockModalOpen(true);
      } catch (error) {
        console.error('Error parsing product from localStorage:', error);
      }
    }
  }, [dispatch]);

  const handleAddStock = () => {
    setSelectedProduct(null);
    setAdjustmentQuantity(0);
    setAdjustmentType('in');
    setAdjustmentReason('');
    setScanError(null);
    setIsAddStockModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddStockModalOpen(false);
    setSelectedProduct(null);
    setAdjustmentQuantity(0);
    setAdjustmentType('in');
    setAdjustmentReason('');
    setScanError(null);
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct) {
      setScanError('Please select a product');
      return;
    }

    if (!adjustmentReason.trim()) {
      setScanError('Please provide a reason for the adjustment');
      return;
    }

    const newStock = adjustmentType === 'in' 
      ? selectedProduct.stock + adjustmentQuantity
      : selectedProduct.stock - adjustmentQuantity;

    if (newStock < 0) {
      setScanError('Stock cannot be negative');
      return;
    }

    try {
      setIsAdjusting(true);
      await dispatch(updateProduct({
        id: selectedProduct.id,
        stock: newStock,
      })).unwrap();
      
      handleCloseModal();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      setScanError('Failed to adjust stock. Please try again.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const getStockStatus = (stock: number, reorderLevel: number): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
    // Get the global low stock threshold from settings
    const globalThreshold = settings.lowStockThreshold || 5;
    
    // Use the product-specific reorder level if set, otherwise fall back to global threshold
    const effectiveThreshold = reorderLevel > 0 ? reorderLevel : globalThreshold;
    
    if (stock === 0) return 'Out of Stock';
    if (stock <= effectiveThreshold) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusBadge = (stock: number, reorderLevel: number) => {
    const status = getStockStatus(stock, reorderLevel);
    const styles = {
      'In Stock': 'bg-green-100 text-green-800',
      'Low Stock': 'bg-yellow-100 text-yellow-800',
      'Out of Stock': 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // Extract unique warehouses from products
  const warehouses = ['All Warehouses', ...new Set(products
    .filter(p => p.location && typeof p.location === 'string')
    .map(p => p.location.split(',')[0].trim())
    .filter(Boolean))];

  // Status options
  const statusOptions = ['All Status', 'In Stock', 'Low Stock', 'Out of Stock'];

  // Filter products
  const filteredProducts = products.filter(product => {
    // Filter out ghost/deleted products
    if (product.id.startsWith('GHOST-') || 
        product.name.startsWith('[DELETED]') ||
        product.sku.startsWith('DELETED-')) {
      return false;
    }
    
    const matchesWarehouse = filterLocation === '' || filterLocation === 'All Warehouses' || 
      (product.location && product.location.startsWith(filterLocation));
    
    const status = getStockStatus(product.stock, product.reorder_level || 0);
    const matchesStatus = filterCategory === '' || filterCategory === 'All Status' || status === filterCategory;
    
    // Search filter
    const searchLower = filterText.toLowerCase();
    const matchesSearch = filterText === '' || 
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower));
    
    return matchesWarehouse && matchesStatus && matchesSearch;
  });

  // Calculate pagination
  const itemsPerPage = settings.inventoryItemsPerPage || 10;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        // TODO: Implement delete product functionality
        console.log('Deleting product:', product.id);
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleClearAllInventory = async () => {
    if (window.confirm('Are you sure you want to clear all inventory? This action cannot be undone.')) {
      try {
        await dispatch(clearAllInventory()).unwrap();
        // Reset filters and current page
        setFilterText('');
        setFilterCategory('All Status');
        setFilterLocation('All Warehouses');
        setCurrentPage(1);
      } catch (error) {
        console.error('Failed to clear inventory:', error);
        alert('Failed to clear inventory. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading inventory</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all products in your inventory including their location, stock levels, and value.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex flex-wrap gap-2">
          <UnifiedBarcodeScanner 
            buttonText="Scan Barcode"
            onComplete={() => dispatch(fetchProducts())}
          />
          <button
            type="button"
            onClick={handleAddStock}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Stock
          </button>
          <button
            type="button"
            onClick={handleClearAllInventory}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <ExclamationTriangleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Clear All
          </button>
        </div>
      </div>

      {/* Add Stock Modal */}
      {isAddStockModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Adjust Stock</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product</label>
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setSelectedProduct(product || null);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Current Stock: {product.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Adjustment Type</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as 'in' | 'out')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="in">Add Stock</option>
                  <option value="out">Remove Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  rows={3}
                  placeholder="Enter reason for stock adjustment"
                />
              </div>

              {/* Error Message */}
              {scanError && (
                <div className="rounded-md bg-red-50 p-3">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-1 text-sm text-red-700">
                        <p>{scanError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  disabled={isAdjusting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStockAdjustment}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                  disabled={isAdjusting}
                >
                  {isAdjusting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-4">
        {/* Search Field */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, SKU, or description..."
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <select
            value={filterLocation}
            onChange={(e) => {
              setFilterLocation(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {warehouses.map(warehouse => (
              <option key={warehouse} value={warehouse}>{warehouse}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const newItemsPerPage = parseInt(e.target.value);
              dispatch(setInventoryItemsPerPage(newItemsPerPage));
              setCurrentPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden border border-gray-200 rounded-lg">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  PRODUCT
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  SKU
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  LOCATION
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  CURRENT STOCK
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  REORDER LEVEL
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  STATUS
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-500 font-medium">{product.name.charAt(0)}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-gray-500">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {product.sku}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {product.location}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {product.stock}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {product.reorder_level}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {getStatusBadge(product.stock, product.reorder_level)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsAddStockModalOpen(true);
                          setAdjustmentQuantity(0);
                          setAdjustmentType('in');
                          setAdjustmentReason('');
                        }}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md p-2 transition-colors"
                        title="Adjust Stock"
                      >
                        <ArrowsRightLeftIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 rounded-md p-2 transition-colors"
                        title="Delete Product"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Section */}
      <div className="mt-6">
        <InventoryHistory />
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-1 text-sm text-gray-700">
            Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
            </span>{' '}
            of <span className="font-medium">{filteredProducts.length}</span> items
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50"
          >
            &lt;
          </button>
          {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 border rounded-md ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
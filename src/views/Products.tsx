import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchProducts, deleteProduct, fetchCategories, fetchLocations, clearAllInventory } from '../store/slices/inventorySlice';
import { setItemsPerPage } from '../store/slices/settingsSlice';
import { useAppSettings } from '../hooks/useAppSettings';
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import AddProductForm from '../components/AddProductForm';
import EditProductForm from '../components/EditProductForm';
import UnifiedBarcodeScanner from '../components/UnifiedBarcodeScanner';
import type { Product } from '../store/types';

const Products: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: products, loading, categories, locations, error } = useSelector((state: RootState) => state.inventory);
  const settings = useSelector((state: RootState) => state.settings);
  const { formatPrice, isLowStock, companyName } = useAppSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [initialSku, setInitialSku] = useState<string>('');
  const [initialProductData, setInitialProductData] = useState<any>({});

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    dispatch(fetchLocations());
  }, [dispatch]);

  // Check for pending barcode from scanner
  useEffect(() => {
    const pendingBarcodeSku = localStorage.getItem('pendingBarcodeSku');
    if (pendingBarcodeSku) {
      // Clear it immediately to prevent re-opening on page refresh
      localStorage.removeItem('pendingBarcodeSku');
      
      // Check for additional product data
      const pendingProductDataStr = localStorage.getItem('pendingProductData');
      localStorage.removeItem('pendingProductData');
      
      let productData = {};
      if (pendingProductDataStr) {
        try {
          productData = JSON.parse(pendingProductDataStr);
        } catch (e) {
          console.error('Error parsing pending product data:', e);
        }
      }
      
      // Set the initial data and open the add form
      setInitialSku(pendingBarcodeSku);
      setInitialProductData(productData);
      setShowAddForm(true);
    }
  }, []);

  // Reset to first page when filters or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, locationFilter, settings.itemsPerPage]);

  // Filter products based on search query, category, and location
  const filteredProducts = products
    .filter(product => {
      // Filter out ghost/deleted products
      if (product.id.startsWith('GHOST-') || 
          product.name.startsWith('[DELETED]') ||
          product.sku.startsWith('DELETED-')) {
        return false;
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesSku = product.sku.toLowerCase().includes(query);
        const matchesDescription = product.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesDescription) return false;
      }
      
      // Apply category filter
      if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
      
      // Apply location filter
      if (locationFilter !== 'all' && product.location !== locationFilter) return false;
      
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * settings.itemsPerPage,
    currentPage * settings.itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / settings.itemsPerPage);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingProductId(id);
      setDeleteError(null);

      // Delete the product using the Redux action
      await dispatch(deleteProduct(id)).unwrap();

      // Check if we need to update the current page
      const remainingProducts = products.filter(p => p.id !== id);
      const totalPages = Math.ceil(remainingProducts.length / settings.itemsPerPage);
      
      if (currentPage > totalPages) {
        setCurrentPage(totalPages || 1);
      } else if (
        remainingProducts.length % settings.itemsPerPage === 0 && 
        currentPage === totalPages && 
        currentPage > 1
      ) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      setDeleteError('Failed to delete product. Please try again.');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleClearAllProducts = async () => {
    if (!window.confirm('Are you sure you want to clear ALL products? This action cannot be undone and will also remove all related stock adjustments and order items.')) {
      return;
    }

    try {
      await dispatch(clearAllInventory()).unwrap();
      setCurrentPage(1);
      setSearchQuery('');
      setCategoryFilter('all');
      setLocationFilter('all');
    } catch (error) {
      console.error('Failed to clear products:', error);
      setDeleteError('Failed to clear all products. Please try again.');
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    dispatch(setItemsPerPage(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className={`${settings.darkMode ? 'bg-[#121212] text-white' : 'bg-white'}`}>
      <div className={`px-4 sm:px-6 lg:px-8 py-6 ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>
        <div className="sm:flex sm:items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${settings.darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>{companyName} Products</h1>
            <p className={`text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              A list of all products in your inventory
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Product
            </button>
            <UnifiedBarcodeScanner 
              buttonText="Scan Barcode" 
              onProductFound={(product) => setEditingProduct(product)}
              onComplete={() => dispatch(fetchProducts())}
            />
            <button
              onClick={handleClearAllProducts}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto transition-colors"
            >
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              Clear All
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="relative rounded-md shadow">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className={`h-5 w-5 ${settings.darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`block w-full rounded-md pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                settings.darkMode 
                  ? 'bg-[#2d2d2d] border-[#3d3d3d] text-white placeholder-gray-500' 
                  : 'border-gray-300 text-gray-900'
              }`}
              placeholder="Search products..."
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`block w-full rounded-md focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              settings.darkMode 
                ? 'bg-[#2d2d2d] border-[#3d3d3d] text-white' 
                : 'border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className={`block w-full rounded-md focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              settings.darkMode 
                ? 'bg-[#2d2d2d] border-[#3d3d3d] text-white' 
                : 'border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>

          <select
            value={settings.itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className={`block w-full rounded-md focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              settings.darkMode 
                ? 'bg-[#2d2d2d] border-[#3d3d3d] text-white' 
                : 'border-gray-300 text-gray-900'
            }`}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        {deleteError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {deleteError}
          </div>
        )}

        {/* Products Table */}
        <div className={`mt-8 flex flex-col ${settings.darkMode ? 'bg-[#1e1e1e]' : 'bg-white'} shadow-xl overflow-hidden sm:rounded-lg border ${settings.darkMode ? 'border-[#3d3d3d]' : 'border-gray-200'}`}>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className={`min-w-full divide-y ${settings.darkMode ? 'divide-[#3d3d3d]' : 'divide-gray-200'}`}>
                <thead className={`${settings.darkMode ? 'bg-[#272727]' : 'bg-gray-50'}`}>
                  <tr>
                    <th scope="col" className={`py-3.5 pl-4 pr-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`}>
                      Product
                    </th>
                    <th scope="col" className={`py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`}>
                      SKU
                    </th>
                    <th scope="col" className={`py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`}>
                      Category
                    </th>
                    <th scope="col" className={`py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`}>
                      Location
                    </th>
                    <th scope="col" className={`py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`}>
                      Stock
                    </th>
                    <th scope="col" className={`py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`}>
                      Price
                    </th>
                    <th scope="col" className={`py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`}>
                      Value
                    </th>
                    <th scope="col" className={`relative py-3.5 pl-3 pr-4 ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${settings.darkMode ? 'divide-[#3d3d3d]' : 'divide-gray-200'}`}>
                  {paginatedProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className={`${settings.darkMode ? 'hover:bg-[#2a2a2a] transition-colors' : 'hover:bg-gray-50'}`}
                    >
                      <td className={`whitespace-nowrap py-4 pl-4 pr-3 text-sm ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        <div className="flex items-center">
                          <div className={`h-10 w-10 flex-shrink-0 rounded-md ${settings.darkMode ? 'bg-blue-900/20' : 'bg-blue-100'} flex items-center justify-center`}>
                            <ShoppingBagIcon className={`h-6 w-6 ${settings.darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                          </div>
                          <div className="ml-4">
                            <div className={`font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</div>
                            <div className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`whitespace-nowrap py-4 px-3 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{product.sku}</td>
                      <td className={`whitespace-nowrap py-4 px-3 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{product.category}</td>
                      <td className={`whitespace-nowrap py-4 px-3 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{product.location}</td>
                      <td className="whitespace-nowrap py-4 px-3 text-sm">
                        <div className="flex items-center">
                          <span 
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium leading-5 ${
                              product.stock <= 0
                                ? settings.darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
                                : isLowStock(product.stock)
                                  ? settings.darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800'
                                  : settings.darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
                            } mr-2`}
                          >
                            {product.stock <= 0 ? 'Out of Stock' : isLowStock(product.stock) ? 'Low Stock' : 'In Stock'}
                          </span>
                          <span className={`${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{product.stock}</span>
                        </div>
                      </td>
                      <td className={`whitespace-nowrap py-4 px-3 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{formatPrice(product.selling_price ?? 0)}</td>
                      <td className={`whitespace-nowrap py-4 px-3 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{formatPrice(product.stock * (product.selling_price ?? 0))}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className={`inline-flex items-center p-1.5 rounded-md transition-colors ${
                              settings.darkMode
                                ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30'
                                : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'
                            }`}
                            disabled={deletingProductId === product.id}
                            title="Edit product"
                          >
                            <PencilIcon className="h-5 w-5" />
                            <span className="sr-only">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className={`inline-flex items-center p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              settings.darkMode
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                                : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                            }`}
                            disabled={deletingProductId === product.id}
                            title="Delete product"
                          >
                            {deletingProductId === product.id ? (
                              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-red-600" />
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
                            <span className="sr-only">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination - Modern Style */}
        <div className="mt-6 flex items-center justify-between">
          <div className={`flex-1 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Showing <span className="font-medium">{((currentPage - 1) * settings.itemsPerPage) + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * settings.itemsPerPage, filteredProducts.length)}
            </span>{' '}
            of <span className="font-medium">{filteredProducts.length}</span> products
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                settings.darkMode 
                  ? 'bg-[#2d2d2d] text-gray-300 border-[#3d3d3d] hover:bg-[#3d3d3d] disabled:opacity-50 disabled:hover:bg-[#2d2d2d]' 
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50'
              } border transition-colors`}
            >
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              const isCurrentPage = page === currentPage;
              const isNearCurrentPage = Math.abs(page - currentPage) <= 1;
              const isFirstPage = page === 1;
              const isLastPage = page === totalPages;

              if (isCurrentPage || isNearCurrentPage || isFirstPage || isLastPage) {
                return (
                  <React.Fragment key={page}>
                    {!isNearCurrentPage && !isFirstPage && page === currentPage - 2 && (
                      <span className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                        settings.darkMode 
                          ? 'bg-[#2d2d2d] text-gray-400 border-[#3d3d3d]' 
                          : 'bg-white text-gray-700 border-gray-300'
                      } border`}>
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border transition-colors ${
                        isCurrentPage
                          ? settings.darkMode
                              ? 'z-10 bg-blue-600 text-white border-blue-600'
                              : 'z-10 bg-blue-600 text-white border-blue-600'
                          : settings.darkMode
                              ? 'bg-[#2d2d2d] text-gray-300 border-[#3d3d3d] hover:bg-[#3d3d3d]'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                    {!isNearCurrentPage && !isLastPage && page === currentPage + 2 && (
                      <span className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                        settings.darkMode 
                          ? 'bg-[#2d2d2d] text-gray-400 border-[#3d3d3d]' 
                          : 'bg-white text-gray-700 border-gray-300'
                      } border`}>
                        ...
                      </span>
                    )}
                  </React.Fragment>
                );
              }
              return null;
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                settings.darkMode 
                  ? 'bg-[#2d2d2d] text-gray-300 border-[#3d3d3d] hover:bg-[#3d3d3d] disabled:opacity-50 disabled:hover:bg-[#2d2d2d]' 
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50'
              } border transition-colors`}
            >
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Add Product Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className={`bg-white rounded-lg p-6 max-w-2xl w-full ${settings.darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
              <AddProductForm 
                onClose={() => setShowAddForm(false)}
                initialSku={initialSku}
                initialProductData={initialProductData}
              />
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <EditProductForm 
            product={editingProduct} 
            onClose={() => setEditingProduct(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default Products; 
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { createProduct, fetchCategories, fetchLocations, addCategory, addLocation } from '../store/slices/inventorySlice';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Database } from '../types/supabase';

interface AddProductFormProps {
  onClose: () => void;
  initialSku?: string;
  initialProductData?: {
    name?: string;
    category?: string;
    location?: string;
    stock?: number;
    cost_price?: number;
    selling_price?: number;
  };
}

type ProductFormData = Required<Omit<Database['public']['Tables']['products']['Insert'], 'id' | 'created_at' | 'updated_at'>> & {
  description: string;
};

const AddProductForm: React.FC<AddProductFormProps> = ({ onClose, initialSku = '', initialProductData = {} }) => {
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector((state: RootState) => state.inventory.categories);
  const locations = useSelector((state: RootState) => state.inventory.locations);
  const products = useSelector((state: RootState) => state.inventory.items);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchLocations());
  }, [dispatch]);

  const [formData, setFormData] = useState<ProductFormData>({
    name: initialProductData.name || '',
    description: '',
    sku: initialSku,
    category: initialProductData.category || '',
    stock: initialProductData.stock || 0,
    cost_price: initialProductData.cost_price || 0,
    selling_price: initialProductData.selling_price || 0,
    location: initialProductData.location || '',
    reorder_level: 10,
    custom_icon: '',
    custom_icon_type: 'default'
  });

  useEffect(() => {
    if (!initialSku && formData.category && formData.name) {
      const prefix = formData.category.slice(0, 2).toUpperCase();
      
      const existingSkus = products
        .filter(p => p.category === formData.category)
        .map(p => p.sku)
        .filter(sku => sku.startsWith(prefix))
        .map(sku => {
          const num = parseInt(sku.slice(3));
          return isNaN(num) ? 0 : num;
        });

      const maxNum = Math.max(0, ...existingSkus);
      const nextNum = maxNum + 1;
      
      const sku = `${prefix}-${String(nextNum).padStart(3, '0')}`;
      
      setFormData(prev => ({ ...prev, sku }));
    }
  }, [formData.category, formData.name, products, initialSku]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: name === 'stock' || name === 'cost_price' || name === 'selling_price' || name === 'reorder_level'
          ? parseFloat(value) || 0
          : value
      };
      return newData;
    });
    setError(null);
  };

  const handleNewCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      dispatch(addCategory(newCategory.trim()));
      setFormData({ ...formData, category: newCategory.trim() });
      setNewCategory('');
      setShowNewCategory(false);
    }
  };

  const handleNewLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocation.trim()) {
      dispatch(addLocation(newLocation.trim()));
      setFormData({ ...formData, location: newLocation.trim() });
      setNewLocation('');
      setShowNewLocation(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Product name is required';
    if (!formData.sku.trim()) return 'SKU is required';
    if (!formData.category.trim()) return 'Category is required';
    if (!formData.location.trim()) return 'Location is required';
    if (formData.cost_price <= 0) return 'Cost price must be greater than 0';
    if (formData.selling_price <= 0) return 'Selling price must be greater than 0';
    if (formData.selling_price <= formData.cost_price) return 'Selling price must be greater than cost price';
    if (formData.stock < 0) return 'Stock cannot be negative';
    if (formData.reorder_level < 0) return 'Reorder level cannot be negative';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await dispatch(createProduct({
        ...formData,
        description: formData.description || null
      })).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to create product:', error);
      setError(error instanceof Error ? error.message : 'Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Add New Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                SKU {initialSku ? '(from Barcode)' : '(Auto-generated)'}
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={initialSku ? handleChange : undefined}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 ${
                  initialSku ? '' : 'bg-gray-50 text-gray-500'
                } sm:text-sm`}
                readOnly={!initialSku}
                disabled={!initialSku}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              {showNewCategory ? (
                <div className="mt-1 flex space-x-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter new category"
                  />
                  <button
                    type="button"
                    onClick={handleNewCategorySubmit}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex space-x-2">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              {showNewLocation ? (
                <div className="mt-1 flex space-x-2">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter new location"
                  />
                  <button
                    type="button"
                    onClick={handleNewLocationSubmit}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewLocation(false)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex space-x-2">
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Select Location</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewLocation(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                Stock
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700">
                Cost Price
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="cost_price"
                  name="cost_price"
                  min="0"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">The price you pay to acquire the product</p>
            </div>

            <div>
              <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700">
                Selling Price
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="selling_price"
                  name="selling_price"
                  min="0"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={handleChange}
                  className={`mt-1 block w-full pl-7 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    formData.selling_price <= formData.cost_price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">The price customers will pay for the product</p>
              {formData.selling_price <= formData.cost_price && (
                <p className="mt-1 text-xs text-red-500">
                  Selling price should be higher than cost price for profit
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reorder_level" className="block text-sm font-medium text-gray-700">
                Reorder Level
              </label>
              <input
                type="number"
                id="reorder_level"
                name="reorder_level"
                value={formData.reorder_level}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </div>
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
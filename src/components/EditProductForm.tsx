import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchCategories, fetchLocations } from '../store/slices/inventorySlice';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Product } from '../store/types';
import SerialNumberManager from './SerialNumberManager';
import RemoveSerialsModal from './RemoveSerialsModal';
import { supabase } from '../lib/supabase';

interface EditProductFormProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProductForm({ product, onClose, onSuccess }: EditProductFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector((state: RootState) => state.inventory.categories);
  const locations = useSelector((state: RootState) => state.inventory.locations);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSerialManager, setShowSerialManager] = useState(false);
  const [showRemoveSerials, setShowRemoveSerials] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    sku: string;
    category: string;
    stock: number;
    cost_price: string;
    selling_price: string;
    location: string;
    reorder_level: number;
    is_serialized: boolean;
  }>({
    name: product.name,
    description: product.description || '',
    sku: product.sku,
    category: product.category,
    stock: product.stock,
    cost_price: product.cost_price !== undefined && product.cost_price !== null ? String(product.cost_price) : '',
    selling_price: product.selling_price !== undefined && product.selling_price !== null ? String(product.selling_price) : '',
    location: product.location,
    reorder_level: product.reorder_level,
    is_serialized: product.is_serialized
  });

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchLocations());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: name === 'stock' || name === 'reorder_level'
          ? Number(value) || 0
          : name === 'cost_price' || name === 'selling_price'
            ? value
            : value
      };
      return newData;
    });
    setError(null);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let cleaned = value.replace(/^0+(?!\.)/, '');
    cleaned = cleaned.replace(/[^\d.]/g, '');
    setFormData(prev => ({
      ...prev,
      [name]: cleaned
    }));
  };

  const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let num = parseFloat(value);
    if (isNaN(num)) num = 0;
    let formatted = num < 1 && num > 0 ? num.toFixed(2) : String(num);
    if (!formatted.includes('.')) formatted += '.00';
    else if (/\.\d$/.test(formatted)) formatted += '0';
    setFormData(prev => ({ ...prev, [name]: formatted }));
  };

  const handlePriceFocus = () => {
    // No need to update priceFocus as it's not used
  };

  const handleReorderLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      reorder_level: Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // For serialized products, stock is managed through serial numbers
      if (formData.is_serialized) {
        const currentStock = Number(product.stock);
        const newStock = Number(formData.stock);
        
        if (newStock > currentStock) {
          // Need to add serials
          setShowSerialManager(true);
          return;
        } else if (newStock < currentStock) {
          // Need to remove serials
          setShowRemoveSerials(true);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          cost_price: formData.cost_price === '' ? null : Number(formData.cost_price),
          selling_price: formData.selling_price === '' ? null : Number(formData.selling_price),
          stock: formData.is_serialized ? Number(product.stock) : Number(formData.stock),
          reorder_level: formData.reorder_level,
          is_serialized: formData.is_serialized,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      setSuccess('Product updated successfully');
      onSuccess();
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSerialsAdded = async () => {
    setShowSerialManager(false);
    const formEvent = new Event('submit') as unknown as React.FormEvent;
    await handleSubmit(formEvent);
  };

  const handleSerialsRemoved = async () => {
    setShowRemoveSerials(false);
    const formEvent = new Event('submit') as unknown as React.FormEvent;
    await handleSubmit(formEvent);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
            {success}
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
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                readOnly
                disabled
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                disabled={isSubmitting}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                disabled={isSubmitting}
              >
                <option value="">Select Location</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
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
                step="1"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
                disabled={formData.is_serialized}
              />
              {formData.is_serialized && (
                <div className="text-xs text-blue-600 mt-1">
                  Stock is managed automatically based on serial numbers. To change stock, add or remove serial numbers.
                </div>
              )}
            </div>

            <div>
              <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700">
                Cost Price
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="text"
                  id="cost_price"
                  name="cost_price"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.cost_price === '' ? '' : String(formData.cost_price)}
                  onChange={handlePriceChange}
                  onBlur={handlePriceBlur}
                  onFocus={handlePriceFocus}
                  className="mt-1 block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">The price you pay to acquire the product</p>
            </div>

            <div>
              <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700">
                Selling Price
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="text"
                  id="selling_price"
                  name="selling_price"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.selling_price === '' ? '' : String(formData.selling_price)}
                  onChange={handlePriceChange}
                  onBlur={handlePriceBlur}
                  onFocus={handlePriceFocus}
                  className={`mt-1 block w-full pl-7 border rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${Number(formData.selling_price) <= Number(formData.cost_price) ? 'border-red-300' : 'border-gray-300'}`}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">The price customers will pay for the product</p>
              {Number(formData.selling_price) <= Number(formData.cost_price) && (
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
                type="text"
                id="reorder_level"
                name="reorder_level"
                value={Number(formData.reorder_level) === 0 ? '' : String(formData.reorder_level ?? '')}
                onChange={handleReorderLevelChange}
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
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
                disabled={isSubmitting}
              />
            </div>
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
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>

        {showSerialManager && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <SerialNumberManager
              productId={product.id}
              initialCount={Number(formData.stock)}
              onClose={handleSerialsAdded}
            />
          </div>
        )}

        {showRemoveSerials && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <RemoveSerialsModal
              productId={product.id}
              onDone={handleSerialsRemoved}
              onClose={() => setShowRemoveSerials(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { createOrder } from '../store/slices/ordersSlice';
import { fetchProducts } from '../store/slices/inventorySlice';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Product } from '../store/types';

interface AddOrderFormProps {
  onClose: () => void;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

export default function AddOrderForm({ onClose }: AddOrderFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const products = useSelector((state: RootState) => state.inventory.items);
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const validateCustomer = (value: string) => {
    if (!value.trim()) {
      return 'Customer name is required';
    }
    if (value.trim().length < 2) {
      return 'Customer name must be at least 2 characters';
    }
    if (value.trim().length > 50) {
      return 'Customer name must be less than 50 characters';
    }
    return null;
  };

  const validateQuantity = (productId: string, requestedQuantity: number): string | null => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      return 'Product not found';
    }

    // Check if we already have this product in our order
    const existingItem = items.find(item => item.product_id === productId);
    const totalRequestedQuantity = (existingItem?.quantity || 0) + requestedQuantity;

    if (totalRequestedQuantity > product.stock) {
      return `Insufficient stock. Only ${product.stock} units available.`;
    }

    if (requestedQuantity <= 0) {
      return 'Quantity must be greater than 0';
    }

    return null;
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    const quantityError = validateQuantity(selectedProduct, quantity);
    if (quantityError) {
      setError(quantityError);
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      setError('Selected product not found');
      return;
    }

    // Check if product already exists in order
    const existingItemIndex = items.findIndex(item => item.product_id === selectedProduct);
    if (existingItemIndex !== -1) {
      // Update existing item quantity
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      setItems(updatedItems);
    } else {
      // Add new item
      const newItem: OrderItem = {
        product_id: product.id,
        quantity,
        price: product.selling_price
      };
      setItems(prev => [...prev, newItem]);
    }

    setSelectedProduct('');
    setQuantity(1);
    setError(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    return items.reduce(
      (acc, item) => {
        const total = item.price * item.quantity;
        return {
          items: acc.items + item.quantity,
          amount: acc.amount + total
        };
      },
      { items: 0, amount: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate customer name
    const customerError = validateCustomer(customer);
    if (customerError) {
      setError(customerError);
      return;
    }

    // Validate items
    if (items.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { items: totalItems, amount: totalAmount } = calculateTotals();
      const result = await dispatch(createOrder({
        customer: customer.trim(),
        status: 'pending',
        total_items: totalItems,
        total_amount: totalAmount,
        items: items
      })).unwrap();

      console.log('Order created successfully:', result);
      onClose();
    } catch (error) {
      console.error('Failed to create order:', error);
      setError(error instanceof Error ? error.message : 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find(p => p.id === id);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Add New Order</h2>
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
          {/* Customer Information */}
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700">
              Customer Name
            </label>
            <input
              type="text"
              id="customer"
              value={customer}
              onChange={(e) => {
                setCustomer(e.target.value);
                setError(null);
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          {/* Add Items */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add Items</h3>
            <div className="flex space-x-4">
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  setError(null);
                }}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Product</option>
                {products.map(product => {
                  const existingItem = items.find(item => item.product_id === product.id);
                  const remainingStock = product.stock - (existingItem?.quantity || 0);
                  return (
                    <option 
                      key={product.id} 
                      value={product.id}
                      disabled={remainingStock <= 0}
                    >
                      {product.name} - ${product.selling_price?.toFixed(2) || '0.00'} (Stock: {remainingStock})
                    </option>
                  );
                })}
              </select>
              <input
                type="number"
                min="1"
                max={selectedProduct ? 
                  products.find(p => p.id === selectedProduct)?.stock - 
                  (items.find(item => item.product_id === selectedProduct)?.quantity || 0) 
                  : 1}
                value={quantity}
                onChange={(e) => {
                  setQuantity(parseInt(e.target.value) || 0);
                  setError(null);
                }}
                className="block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedProduct || quantity <= 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Items List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Order Items</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => {
                    const product = getProductById(item.product_id);
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${(item.quantity * item.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No items added yet
                      </td>
                    </tr>
                  )}
                </tbody>
                {items.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        Total:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${calculateTotals().amount.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
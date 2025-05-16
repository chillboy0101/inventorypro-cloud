import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { updateProduct } from '../store/slices/inventorySlice';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { Product } from '../store/types';

const ScanItems: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const products = useSelector((state: RootState) => state.inventory.items);
  const [scannedSku, setScannedSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (message) {
      timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [message]);

  const handleScan = async (sku: string) => {
    setScannedSku(sku);
    const product = products.find(p => p.sku === sku);
    
    if (!product) {
      setMessage({ type: 'error', text: `Product with SKU ${sku} not found` });
      return;
    }

    try {
      setIsSubmitting(true);
      await dispatch(updateProduct({
        id: product.id,
        stock: (product.stock || 0) + quantity
      })).unwrap();
      
      setMessage({ type: 'success', text: `Added ${quantity} units to ${product.name}` });
      setScannedSku('');
      setQuantity(1);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update quantity' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedSku) return;
    await handleScan(scannedSku);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Scan Items
          </h2>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <BarcodeScanner
            onScan={handleScan}
            buttonText="Scan Product"
          />

          <div className="mt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Manual Entry</h3>
            <form onSubmit={handleManualSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                  SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  value={scannedSku}
                  onChange={(e) => setScannedSku(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !scannedSku}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    (isSubmitting || !scannedSku) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Updating...' : 'Update Quantity'}
                </button>
              </div>
            </form>
          </div>

          {message && (
            <div className={`mt-4 rounded-md p-4 ${
              message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex">
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanItems; 
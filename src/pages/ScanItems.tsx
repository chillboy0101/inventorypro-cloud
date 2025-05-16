import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrReader } from 'react-qr-reader';
import { productsApi } from '../lib/api';

const ScanItems: React.FC = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<any>(null);

  const handleScan = async (result: any) => {
    if (!result || !result.text) return;

    try {
      setScanning(false);
      const sku = result.text;
      const product = await productsApi.getBySku(sku);
      
      if (product) {
        setScannedProduct(product);
      } else {
        setError(`No product found with SKU: ${sku}`);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
    }
  };

  // Error handling is now managed in the QrReader component itself
  // We receive errors through the onResult callback when there's an issue

  const handleReset = () => {
    setScanning(true);
    setError(null);
    setScannedProduct(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Scan Items</h1>

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        {scanning ? (
          <div className="aspect-square max-w-md mx-auto">
            <QrReader
              constraints={{ facingMode: 'environment' }}
              onResult={handleScan}
              className="w-full"
            />
            <p className="mt-4 text-sm text-gray-600 text-center">
              Position the barcode/QR code in the center of the camera view
            </p>
          </div>
        ) : scannedProduct ? (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Scanned Product</h2>
            <div className="border rounded-lg p-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{scannedProduct.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">SKU</dt>
                  <dd className="mt-1 text-sm text-gray-900">{scannedProduct.sku}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Stock</dt>
                  <dd className="mt-1 text-sm text-gray-900">{scannedProduct.quantity}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="mt-1 text-sm text-gray-900">${scannedProduct.price.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Done
          </button>
          {!scanning && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Scan Another
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanItems; 
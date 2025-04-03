import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { productsApi } from '../lib/api';

interface CSVRow {
  name: string;
  sku: string;
  description?: string;
  price: string;
  quantity: string;
  minimum_quantity: string;
}

const ImportCSV: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file');
          return;
        }
        setPreview(results.data as CSVRow[]);
      },
      error: (error) => {
        setError('Error reading CSV file: ' + error.message);
      }
    });
  };

  const handleImport = async () => {
    if (!preview.length) {
      setError('No data to import');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const products = preview.map(row => ({
        name: row.name,
        sku: row.sku,
        description: row.description || '',
        price: parseFloat(row.price),
        quantity: parseInt(row.quantity),
        minimum_quantity: parseInt(row.minimum_quantity),
      }));

      // Import products in batches
      for (const product of products) {
        await productsApi.create(product);
      }

      navigate('/products');
    } catch (err) {
      console.error('Error importing products:', err);
      setError(err instanceof Error ? err.message : 'Failed to import products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Import Products from CSV</h1>

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload CSV File
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">CSV file up to 10MB</p>
            </div>
          </div>
        </div>

        {fileName && (
          <p className="text-sm text-gray-600 mb-4">
            Selected file: {fileName}
          </p>
        )}

        {preview.length > 0 && (
          <>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Preview</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 5 && (
                <p className="mt-2 text-sm text-gray-500">
                  Showing 5 of {preview.length} items
                </p>
              )}
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || !preview.length}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Import Products'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportCSV; 
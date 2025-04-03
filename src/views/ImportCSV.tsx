import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { createProduct } from '../store/slices/inventorySlice';
import Papa from 'papaparse';
import type { Database } from '../types/supabase';

type ProductInsert = Database['public']['Tables']['products']['Insert'];

interface CSVRow {
  name: string;
  sku: string;
  price: string;
  quantity: string;
  minimum_quantity: string;
}

const ImportCSV: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const validateRow = (row: CSVRow): string[] => {
    const errors: string[] = [];

    // Required fields validation
    if (!row.name?.trim()) errors.push('Product name is required');
    if (!row.sku?.trim()) errors.push('SKU is required');
    
    // Price validation
    if (!row.price) {
      errors.push('Price is required');
    } else {
      const price = parseFloat(row.price);
      if (isNaN(price)) {
        errors.push('Price must be a valid number');
      } else if (price < 0) {
        errors.push('Price cannot be negative');
      } else if (price > 1000000) {
        errors.push('Price exceeds maximum allowed value');
      }
    }

    // Quantity validation
    if (!row.quantity) {
      errors.push('Quantity is required');
    } else {
      const quantity = parseInt(row.quantity);
      if (isNaN(quantity)) {
        errors.push('Quantity must be a valid number');
      } else if (quantity < 0) {
        errors.push('Quantity cannot be negative');
      } else if (quantity > 1000000) {
        errors.push('Quantity exceeds maximum allowed value');
      }
    }

    // Minimum quantity validation
    if (!row.minimum_quantity) {
      errors.push('Minimum quantity is required');
    } else {
      const minQty = parseInt(row.minimum_quantity);
      if (isNaN(minQty)) {
        errors.push('Minimum quantity must be a valid number');
      } else if (minQty < 0) {
        errors.push('Minimum quantity cannot be negative');
      } else if (minQty > parseInt(row.quantity || '0')) {
        errors.push('Minimum quantity cannot be greater than current quantity');
      }
    }

    return errors;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Please upload a valid CSV file']);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(['File size exceeds 5MB limit']);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrors([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as CSVRow[];
        
        // Validate required columns
        const requiredColumns = ['name', 'sku', 'price', 'quantity', 'minimum_quantity'];
        const missingColumns = requiredColumns.filter(col => !results.meta.fields?.includes(col));
        
        if (missingColumns.length > 0) {
          setErrors([`Missing required columns: ${missingColumns.join(', ')}`]);
          setIsUploading(false);
          return;
        }

        // Validate number of rows
        if (rows.length === 0) {
          setErrors(['CSV file is empty']);
          setIsUploading(false);
          return;
        }

        if (rows.length > 1000) {
          setErrors(['CSV file contains too many rows (maximum 1000)']);
          setIsUploading(false);
          return;
        }

        const totalRows = rows.length;
        const errors: string[] = [];
        let processedCount = 0;
        let successCount = 0;

        for (const [index, row] of rows.entries()) {
          const rowErrors = validateRow(row);
          if (rowErrors.length > 0) {
            errors.push(`Row ${index + 1}: ${rowErrors.join(', ')}`);
            continue;
          }

          try {
            const product: ProductInsert = {
              name: row.name.trim(),
              sku: row.sku.trim(),
              selling_price: parseFloat(row.price),
              stock: parseInt(row.quantity),
              reorder_level: parseInt(row.minimum_quantity),
              category: 'Imported', // Default category for imported products
              cost_price: parseFloat(row.price) * 0.7, // Estimate cost as 70% of selling price
              location: 'Main Warehouse' // Default location
            };

            await dispatch(createProduct(product)).unwrap();
            processedCount++;
            successCount++;
            setUploadProgress(Math.round((processedCount / totalRows) * 100));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Row ${index + 1}: Failed to import - ${errorMessage}`);
            processedCount++;
            setUploadProgress(Math.round((processedCount / totalRows) * 100));
          }
        }

        setErrors(errors);
        setIsUploading(false);

        if (errors.length === 0) {
          alert(`Successfully imported ${successCount} products!`);
          navigate('/products');
        } else {
          // If some rows were successful, show a summary
          if (successCount > 0) {
            alert(`Imported ${successCount} out of ${totalRows} products. Check the error list for details.`);
          }
        }
      },
      error: (error) => {
        setErrors([`Failed to parse CSV file: ${error.message}`]);
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Import Products from CSV
          </h2>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Upload a CSV file with the following columns:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>name (required)</li>
              <li>sku (required)</li>
              <li>price (required, positive number)</li>
              <li>quantity (required, non-negative number)</li>
              <li>minimum_quantity (required, non-negative number)</li>
            </ul>
          </div>

          <div className="mt-5">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? 'Uploading...' : 'Select CSV File'}
            </button>
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                      Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-indigo-600">
                      {uploadProgress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                  <div
                    style={{ width: `${uploadProgress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-4">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Import Errors ({errors.length})
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportCSV; 
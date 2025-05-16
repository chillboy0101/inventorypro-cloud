import React, { useState } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import AddProductForm from './AddProductForm';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAppSettings } from '../hooks/useAppSettings';

interface BarcodeProductAdderProps {
  onComplete?: () => void;
}

/**
 * A component that allows adding a new product by first scanning its barcode
 */
const BarcodeProductAdder: React.FC<BarcodeProductAdderProps> = ({ onComplete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { isDarkMode } = useAppSettings();

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setScannedBarcode(null);
    setShowAddForm(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setScannedBarcode(null);
    setShowAddForm(false);
    if (onComplete) onComplete();
  };

  const handleBarcodeScanned = async (barcode: string): Promise<void> => {
    setScannedBarcode(barcode);
    setShowAddForm(true);
  };

  const handleFormClose = () => {
    handleCloseModal();
  };

  return (
    <>
      {/* Button to open the modal */}
      <button
        onClick={handleOpenModal}
        className={`
          inline-flex items-center px-4 py-2 border border-transparent 
          text-sm font-medium rounded-md shadow-sm text-white
          ${isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}
          transition-colors duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        `}
      >
        Add Product by Barcode
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            {/* Overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            {/* Modal Content */}
            <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className={`text-lg leading-6 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`} id="modal-title">
                        {!showAddForm ? 'Scan Product Barcode' : 'Add Product Details'}
                      </h3>
                      <button
                        type="button"
                        className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
                        onClick={handleCloseModal}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-4">
                      {!showAddForm ? (
                        <div className="text-center">
                          <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Scan the barcode of the product you want to add to your inventory
                          </p>
                          <div className="flex justify-center my-4">
                            <BarcodeScanner 
                              onScan={handleBarcodeScanned}
                              buttonText="Start Scanning"
                            />
                          </div>
                        </div>
                      ) : (
                        // We'll pass the barcode to the form by wrapping it
                        <BarcodeAddProductForm 
                          barcode={scannedBarcode || ''} 
                          onClose={handleFormClose} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Wrapper for AddProductForm that pre-fills barcode data
interface BarcodeAddProductFormProps {
  barcode: string;
  onClose: () => void;
}

const BarcodeAddProductForm: React.FC<BarcodeAddProductFormProps> = ({ barcode, onClose }) => {
  // Use the regular AddProductForm but intercept to pre-fill barcode as SKU
  // and potentially other data in the future
  
  // We're integrating with the existing AddProductForm, but note that
  // ideally we would extend it to better handle barcodes as UPC/EAN codes
  // distinct from internal SKUs
  
  return (
    <div className="w-full">
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>Barcode scanned:</strong> {barcode}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          This barcode will be used as the SKU for your new product.
        </p>
      </div>
      
      <AddProductForm 
        onClose={onClose} 
        initialSku={barcode}
      />
    </div>
  );
};

export default BarcodeProductAdder;

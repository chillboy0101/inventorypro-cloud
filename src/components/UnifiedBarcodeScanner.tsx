import React, { useState, useRef, useEffect } from 'react';
import { useAppSettings } from '../hooks/useAppSettings';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCodeIcon,
  XMarkIcon,
  CameraIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { Product } from '../store/types';

interface UnifiedBarcodeScannerProps {
  onComplete?: () => void;
  buttonText?: string;
}

/**
 * A unified barcode scanning component that can:
 * 1. Scan a barcode to find an existing product
 * 2. Add a new product using the scanned barcode
 */
const UnifiedBarcodeScanner: React.FC<UnifiedBarcodeScannerProps> = ({ 
  onComplete,
  buttonText = 'Scan Barcode'
}) => {
  const { items: products } = useSelector((state: RootState) => state.inventory);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [productFound, setProductFound] = useState<Product | null>(null);
  const [lastScanResults, setLastScanResults] = useState<Array<{barcode: string, product: Product | null, timestamp: number}>>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { enableBarcodeScanning, isDarkMode } = useAppSettings();
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Check if camera is available
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setHasCamera(cameras.length > 0);
      } catch (err) {
        console.error('Error checking camera:', err);
        setHasCamera(false);
      }
    };

    if (isModalOpen) {
      checkCamera();
    }
    
    return () => {
      stopScanner();
    };
  }, [isModalOpen]);

  // Start scanning when modal is opened and camera mode is selected
  useEffect(() => {
    if (isModalOpen && scanMode === 'camera' && hasCamera && !showConfirmation) {
      startScanner();
    } else {
      stopScanner();
    }
  }, [isModalOpen, scanMode, hasCamera, showConfirmation]);

  const openScanner = () => {
    if (!enableBarcodeScanning) {
      setError('Barcode scanning is disabled in settings. Enable it in User Settings to use this feature.');
      return;
    }
    
    setIsModalOpen(true);
    setError(null);
    setScannedBarcode(null);
    setProductFound(null);
    setShowConfirmation(false);
    setScanMode(hasCamera ? 'camera' : 'manual');
  };

  const closeScanner = () => {
    stopScanner();
    setIsModalOpen(false);
    setError(null);
    setShowConfirmation(false);
    
    if (onComplete) {
      onComplete();
    }
  };

  const startScanner = async () => {
    if (!videoContainerRef.current) return;
    
    try {
      setIsScanning(true);
      setError(null);
      
      // Initialize the scanner
      const html5QrCode = new Html5Qrcode('scanner-container');
      html5QrCodeRef.current = html5QrCode;
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      await html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
          // On successful scan
          handleCodeScanned(decodedText);
        },
        (errorMessage) => {
          // Ignore the QR code not found error
          if (errorMessage.includes('QR code not found')) {
            return;
          }
          console.log(`Code scanning error: ${errorMessage}`);
        }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to access camera. Please check camera permissions or try manual entry.');
      setIsScanning(false);
      setScanMode('manual');
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().catch(err => {
        console.error('Error stopping scanner:', err);
      });
    }
    setIsScanning(false);
  };

  const handleCodeScanned = (barcode: string) => {
    stopScanner();
    setScannedBarcode(barcode);
    
    // Try to find the product by its barcode/SKU
    const product = products.find(p => p.sku === barcode);
    
    // Add to scan history
    setLastScanResults(prev => {
      const newResults = [
        { 
          barcode, 
          product: product || null, 
          timestamp: Date.now()
        },
        ...prev.slice(0, 4) // Keep last 5 scans
      ];
      return newResults;
    });
    
    if (product) {
      setProductFound(product);
    } else {
      setProductFound(null);
    }

    // Show confirmation dialog for either case
    setShowConfirmation(true);
  };

  const handleManualEntry = () => {
    if (!manualBarcode.trim()) {
      setError('Please enter a barcode');
      return;
    }
    
    handleCodeScanned(manualBarcode.trim());
    setManualBarcode(''); // Clear the input for next scan
  };

  const handleContinueScanning = () => {
    setScannedBarcode(null);
    setProductFound(null);
    setShowConfirmation(false);
    setScanMode(hasCamera ? 'camera' : 'manual');
    
    if (hasCamera && scanMode === 'camera') {
      startScanner();
    }
  };

  const handleGoToStockAdjustment = () => {
    if (productFound) {
      closeScanner();
      localStorage.setItem('adjustStockProduct', JSON.stringify(productFound));
      window.location.href = '/inventory'; // Or wherever your stock adjustment page is
    }
  };

  const handleAddProduct = () => {
    if (scannedBarcode) {
      localStorage.setItem('pendingBarcodeSku', scannedBarcode);
      closeScanner();
      window.location.href = '/products';
    }
  };

  return (
    <>
      <button
        onClick={openScanner}
        disabled={isScanning}
        className={`
          inline-flex items-center px-4 py-2 border border-transparent 
          text-sm font-medium rounded-md shadow-sm text-white
          ${isDarkMode 
            ? 'bg-blue-700 hover:bg-blue-600' 
            : 'bg-blue-600 hover:bg-blue-700'
          }
          ${isScanning ? 'opacity-75 cursor-not-allowed' : ''}
          transition-colors duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        `}
      >
        <QrCodeIcon className="-ml-1 mr-2 h-5 w-5" />
        {buttonText}
      </button>

      {error && !isModalOpen && (
        <div className={`mt-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </div>
      )}

      {/* Scanner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            {/* Modal Content */}
            <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className={`text-lg leading-6 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`} id="modal-title">
                        {showConfirmation 
                          ? (productFound ? 'Product Found' : 'Product Not Found') 
                          : 'Scan Product Barcode'
                        }
                      </h3>
                      <button
                        type="button"
                        className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
                        onClick={closeScanner}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className={`my-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        {error}
                      </div>
                    )}

                    {/* Confirmation Dialog */}
                    {showConfirmation && (
                      <div className="mt-4">
                        <div className={`p-4 rounded-md ${
                          productFound 
                            ? (isDarkMode ? 'bg-green-800 bg-opacity-25' : 'bg-green-50 border border-green-200') 
                            : (isDarkMode ? 'bg-yellow-800 bg-opacity-25' : 'bg-yellow-50 border border-yellow-200')
                        }`}>
                          <p className={`font-medium ${
                            productFound 
                              ? (isDarkMode ? 'text-green-200' : 'text-green-800') 
                              : (isDarkMode ? 'text-yellow-200' : 'text-yellow-800')
                          }`}>
                            Barcode scanned: {scannedBarcode}
                          </p>
                          
                          {productFound ? (
                            <div className="mt-2">
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <span className="font-medium">Product:</span> {productFound.name}
                              </p>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <span className="font-medium">Current Stock:</span> {productFound.stock} units
                              </p>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <span className="font-medium">Price:</span> ${productFound.selling_price?.toFixed(2) || '0.00'}
                              </p>
                              <p className={`text-sm mt-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Would you like to adjust stock for this product?
                              </p>
                              
                              <div className="mt-4 flex space-x-3">
                                <button
                                  type="button"
                                  onClick={handleGoToStockAdjustment}
                                  className={`
                                    flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                                    ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                  `}
                                >
                                  Yes, Adjust Stock
                                </button>
                                <button
                                  type="button"
                                  onClick={handleContinueScanning}
                                  className={`
                                    flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium
                                    ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'}
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                  `}
                                >
                                  No, Continue Scanning
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                No product found with this barcode. Would you like to add it as a new product?
                              </p>
                              
                              <div className="mt-4 flex space-x-3">
                                <button
                                  type="button"
                                  onClick={handleAddProduct}
                                  className={`
                                    flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                                    ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                  `}
                                >
                                  Yes, Add New Product
                                </button>
                                <button
                                  type="button"
                                  onClick={handleContinueScanning}
                                  className={`
                                    flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium
                                    ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'}
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                  `}
                                >
                                  No, Continue Scanning
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mode Selection */}
                    {!showConfirmation && (
                      <div className="mt-4 flex space-x-4">
                        <button
                          type="button"
                          onClick={() => setScanMode('camera')}
                          disabled={!hasCamera}
                          className={`
                            flex-1 py-2 px-4 rounded-md text-sm font-medium 
                            ${scanMode === 'camera'
                              ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`
                              : `${isDarkMode 
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`
                            }
                            ${!hasCamera ? 'opacity-50 cursor-not-allowed' : ''}
                            transition-colors duration-150 ease-in-out
                          `}
                        >
                          <CameraIcon className="h-5 w-5 inline mr-2" />
                          Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => setScanMode('manual')}
                          className={`
                            flex-1 py-2 px-4 rounded-md text-sm font-medium
                            ${scanMode === 'manual'
                              ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`
                              : `${isDarkMode 
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`
                            }
                            transition-colors duration-150 ease-in-out
                          `}
                        >
                          <PencilIcon className="h-5 w-5 inline mr-2" />
                          Manual Entry
                        </button>
                      </div>
                    )}

                    {/* Camera Scanner */}
                    {scanMode === 'camera' && !showConfirmation && (
                      <div className="mt-4">
                        {hasCamera ? (
                          <div 
                            id="scanner-container" 
                            ref={videoContainerRef}
                            className="rounded-lg overflow-hidden bg-gray-900 w-full h-64 flex items-center justify-center"
                          >
                            <div className="text-white text-center">
                              {isScanning ? 'Position barcode in the camera view' : 'Starting camera...'}
                            </div>
                          </div>
                        ) : (
                          <div className={`p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              No camera detected. Please use manual entry instead.
                            </p>
                          </div>
                        )}
                        
                        {/* Recent Scan Results */}
                        {lastScanResults.length > 0 && (
                          <div className={`mt-4 p-3 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              Recent Scans
                            </h4>
                            <div className="max-h-32 overflow-y-auto">
                              {lastScanResults.map((result, idx) => (
                                <div 
                                  key={idx} 
                                  className={`
                                    flex items-center justify-between py-1 text-xs
                                    ${idx > 0 ? 'border-t border-opacity-25' : ''}
                                    ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}
                                  `}
                                >
                                  <div>
                                    <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                      {result.barcode}
                                    </span>
                                  </div>
                                  <div>
                                    {result.product ? (
                                      <span className={`px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800'}`}>
                                        Found: {result.product.name}
                                      </span>
                                    ) : (
                                      <span className={`px-2 py-1 rounded-full ${isDarkMode ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-100 text-yellow-800'}`}>
                                        Not Found
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manual Entry */}
                    {scanMode === 'manual' && !showConfirmation && (
                      <div className="mt-4">
                        <div className={`p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <label 
                            htmlFor="manual-barcode" 
                            className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}
                          >
                            Enter Barcode Manually
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              id="manual-barcode"
                              value={manualBarcode}
                              onChange={(e) => setManualBarcode(e.target.value)}
                              className={`
                                block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                                ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : ''}
                              `}
                              placeholder="Enter barcode number"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleManualEntry();
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleManualEntry}
                              className={`
                                inline-flex items-center px-4 py-2 border border-transparent 
                                text-sm font-medium rounded-md shadow-sm text-white
                                ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                              `}
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

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

export default UnifiedBarcodeScanner;

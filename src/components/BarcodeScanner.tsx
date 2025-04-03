import React, { useState, useRef, useEffect } from 'react';
import { useAppSettings } from '../hooks/useAppSettings';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCodeIcon,
  XMarkIcon,
  CameraIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface BarcodeScannerProps {
  onCodeScanned: (code: string) => void;
  buttonText?: string;
}

/**
 * A component that provides barcode/QR scanning functionality
 * using the camera or manual input, respecting the user's settings
 */
const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onCodeScanned,
  buttonText = 'Scan Barcode/QR' 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [manualBarcode, setManualBarcode] = useState('');
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
    if (isModalOpen && scanMode === 'camera' && hasCamera) {
      startScanner();
    } else {
      stopScanner();
    }
  }, [isModalOpen, scanMode, hasCamera]);

  const openScanner = () => {
    if (!enableBarcodeScanning) {
      setError('Barcode scanning is disabled in settings. Enable it in User Settings to use this feature.');
      return;
    }
    
    setIsModalOpen(true);
    setError(null);
    setScanMode(hasCamera ? 'camera' : 'manual');
  };

  const closeScanner = () => {
    stopScanner();
    setIsModalOpen(false);
    setError(null);
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

  const handleCodeScanned = (decodedText: string) => {
    stopScanner();
    onCodeScanned(decodedText);
    closeScanner();
  };

  const handleManualEntry = () => {
    if (!manualBarcode.trim()) {
      setError('Please enter a barcode');
      return;
    }
    
    handleCodeScanned(manualBarcode.trim());
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
            ? 'bg-green-700 hover:bg-green-600' 
            : 'bg-green-600 hover:bg-green-700'
          }
          ${isScanning ? 'opacity-75 cursor-not-allowed' : ''}
          transition-colors duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
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
                        Scan Barcode
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

                    {/* Mode Selection */}
                    <div className="mt-4 flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setScanMode('camera')}
                        disabled={!hasCamera}
                        className={`
                          flex-1 py-2 px-4 rounded-md text-sm font-medium flex flex-col items-center
                          ${!hasCamera ? 'opacity-50 cursor-not-allowed' : ''}
                          ${scanMode === 'camera' 
                            ? isDarkMode 
                              ? 'bg-blue-800 text-blue-200' 
                              : 'bg-blue-100 text-blue-700'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        <CameraIcon className="h-5 w-5 mb-1" />
                        Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => setScanMode('manual')}
                        className={`
                          flex-1 py-2 px-4 rounded-md text-sm font-medium flex flex-col items-center
                          ${scanMode === 'manual' 
                            ? isDarkMode 
                              ? 'bg-blue-800 text-blue-200' 
                              : 'bg-blue-100 text-blue-700'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        <PencilIcon className="h-5 w-5 mb-1" />
                        Manual Entry
                      </button>
                    </div>

                    {/* Camera Scanner */}
                    {scanMode === 'camera' && (
                      <div className="mt-4">
                        <div 
                          id="scanner-container" 
                          ref={videoContainerRef}
                          className={`
                            h-64 w-full rounded-lg overflow-hidden relative
                            ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}
                          `}
                        >
                          {isScanning && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white bg-opacity-80 rounded-lg p-2 shadow">
                                <div className="w-64 h-64 border-2 border-dashed border-blue-500 flex items-center justify-center">
                                  <p className="text-sm text-blue-700">Position barcode here</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {error && (
                          <div className="mt-2 text-sm text-red-600">
                            {error}
                          </div>
                        )}
                        <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Point your camera at a barcode or QR code to scan it.
                        </p>
                      </div>
                    )}

                    {/* Manual Entry */}
                    {scanMode === 'manual' && (
                      <div className="mt-4">
                        <label htmlFor="manual-barcode" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Enter Barcode Manually
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="text"
                            id="manual-barcode"
                            value={manualBarcode}
                            onChange={(e) => setManualBarcode(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleManualEntry();
                              }
                            }}
                            className={`
                              flex-1 min-w-0 block w-full px-3 py-2 rounded-md sm:text-sm
                              ${isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500' 
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                              }
                            `}
                            placeholder="Enter barcode"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleManualEntry}
                            className={`
                              ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm
                              text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                              ${!manualBarcode.trim() ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            disabled={!manualBarcode.trim()}
                          >
                            Enter
                          </button>
                        </div>
                        {error && (
                          <div className="mt-2 text-sm text-red-600">
                            {error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${isDarkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'}`}>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 text-base font-medium sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm
                    ${isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                    }"
                  onClick={closeScanner}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BarcodeScanner;
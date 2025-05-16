import React, { useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCodeIcon } from '@heroicons/react/24/outline';

interface BarcodeScannerProps {
  onScan: (code: string) => Promise<void>;
  buttonText?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, buttonText = 'Scan Barcode/QR' }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    if (!videoContainerRef.current) return;
    
    try {
      html5QrCodeRef.current = new Html5Qrcode("html5qr");
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          stopScanner();
          await onScan(decodedText);
        },
        (errorMessage: string) => {
          if (errorMessage.includes('QR code not found')) {
            return;
          }
          console.error('QR scanning error:', errorMessage);
          setError(errorMessage);
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to access camera. Please check camera permissions.');
      setIsScanning(false);
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

  return (
    <div className="relative">
      <button
        onClick={startScanner}
        disabled={isScanning}
        className={`inline-flex items-center px-4 py-2 border border-transparent 
          text-sm font-medium rounded-md shadow-sm text-white
          bg-green-600 hover:bg-green-700
          ${isScanning ? 'opacity-75 cursor-not-allowed' : ''}
          transition-colors duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
        `}
      >
        <QrCodeIcon className="-ml-1 mr-2 h-5 w-5" />
        {buttonText}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div ref={videoContainerRef} className={`w-full h-64 ${isScanning ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
      
      <button
        onClick={isScanning ? stopScanner : startScanner}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg"
      >
        {isScanning ? 'Stop Scanning' : 'Start Scanning'}
      </button>
    </div>
  );
};

export { BarcodeScanner };
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCodeIcon } from '@heroicons/react/24/outline';
const BarcodeScanner = ({ onScan, buttonText = 'Scan Barcode/QR' }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const videoContainerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
    const startScanner = async () => {
        if (!videoContainerRef.current)
            return;
        try {
            html5QrCodeRef.current = new Html5Qrcode("html5qr");
            await html5QrCodeRef.current.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, async (decodedText) => {
                stopScanner();
                await onScan(decodedText);
            }, (errorMessage) => {
                if (errorMessage.includes('QR code not found')) {
                    return;
                }
                console.error('QR scanning error:', errorMessage);
                setError(errorMessage);
            });
            setIsScanning(true);
        }
        catch (err) {
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
    return (_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: startScanner, disabled: isScanning, className: `inline-flex items-center px-4 py-2 border border-transparent 
          text-sm font-medium rounded-md shadow-sm text-white
          bg-green-600 hover:bg-green-700
          ${isScanning ? 'opacity-75 cursor-not-allowed' : ''}
          transition-colors duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
        `, children: [_jsx(QrCodeIcon, { className: "-ml-1 mr-2 h-5 w-5" }), buttonText] }), error && (_jsx("div", { className: "mt-2 text-sm text-red-600", children: error })), _jsx("div", { ref: videoContainerRef, className: `w-full h-64 ${isScanning ? 'opacity-100' : 'opacity-0'} transition-opacity` }), _jsx("button", { onClick: isScanning ? stopScanner : startScanner, className: "absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg", children: isScanning ? 'Stop Scanning' : 'Start Scanning' })] }));
};
export { BarcodeScanner };

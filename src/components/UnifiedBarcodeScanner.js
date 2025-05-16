import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useAppSettings } from '../hooks/useAppSettings';
import { useSelector } from 'react-redux';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCodeIcon, XMarkIcon, CameraIcon, PencilIcon } from '@heroicons/react/24/outline';
/**
 * A unified barcode scanning component that can:
 * 1. Scan a barcode to find an existing product
 * 2. Add a new product using the scanned barcode
 */
const UnifiedBarcodeScanner = ({ onComplete, buttonText = 'Scan Barcode' }) => {
    const { items: products } = useSelector((state) => state.inventory);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [hasCamera, setHasCamera] = useState(false);
    const [scanMode, setScanMode] = useState('camera');
    const [manualBarcode, setManualBarcode] = useState('');
    const [scannedBarcode, setScannedBarcode] = useState(null);
    const [productFound, setProductFound] = useState(null);
    const [lastScanResults, setLastScanResults] = useState([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const { enableBarcodeScanning, isDarkMode } = useAppSettings();
    const videoContainerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
    // Check if camera is available
    useEffect(() => {
        const checkCamera = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const cameras = devices.filter(device => device.kind === 'videoinput');
                setHasCamera(cameras.length > 0);
            }
            catch (err) {
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
        }
        else {
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
        if (!videoContainerRef.current)
            return;
        try {
            setIsScanning(true);
            setError(null);
            // Initialize the scanner
            const html5QrCode = new Html5Qrcode('scanner-container');
            html5QrCodeRef.current = html5QrCode;
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            await html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
                // On successful scan
                handleCodeScanned(decodedText);
            }, (errorMessage) => {
                // Ignore the QR code not found error
                if (errorMessage.includes('QR code not found')) {
                    return;
                }
                console.log(`Code scanning error: ${errorMessage}`);
            });
        }
        catch (err) {
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
    const handleCodeScanned = (barcode) => {
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
        }
        else {
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
    return (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: openScanner, disabled: isScanning, className: `
          inline-flex items-center px-4 py-2 border border-transparent 
          text-sm font-medium rounded-md shadow-sm text-white
          ${isDarkMode
                    ? 'bg-blue-700 hover:bg-blue-600'
                    : 'bg-blue-600 hover:bg-blue-700'}
          ${isScanning ? 'opacity-75 cursor-not-allowed' : ''}
          transition-colors duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        `, children: [_jsx(QrCodeIcon, { className: "-ml-1 mr-2 h-5 w-5" }), buttonText] }), error && !isModalOpen && (_jsx("div", { className: `mt-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`, children: error })), isModalOpen && (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto", "aria-labelledby": "modal-title", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0", children: [_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity", "aria-hidden": "true" }), _jsx("div", { className: `inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`, children: _jsx("div", { className: `px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`, children: _jsx("div", { className: "sm:flex sm:items-start", children: _jsxs("div", { className: "mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: `text-lg leading-6 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`, id: "modal-title", children: showConfirmation
                                                            ? (productFound ? 'Product Found' : 'Product Not Found')
                                                            : 'Scan Product Barcode' }), _jsxs("button", { type: "button", className: `${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`, onClick: closeScanner, children: [_jsx("span", { className: "sr-only", children: "Close" }), _jsx(XMarkIcon, { className: "h-6 w-6", "aria-hidden": "true" })] })] }), error && (_jsx("div", { className: `my-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`, children: error })), showConfirmation && (_jsx("div", { className: "mt-4", children: _jsxs("div", { className: `p-4 rounded-md ${productFound
                                                        ? (isDarkMode ? 'bg-green-800 bg-opacity-25' : 'bg-green-50 border border-green-200')
                                                        : (isDarkMode ? 'bg-yellow-800 bg-opacity-25' : 'bg-yellow-50 border border-yellow-200')}`, children: [_jsxs("p", { className: `font-medium ${productFound
                                                                ? (isDarkMode ? 'text-green-200' : 'text-green-800')
                                                                : (isDarkMode ? 'text-yellow-200' : 'text-yellow-800')}`, children: ["Barcode scanned: ", scannedBarcode] }), productFound ? (_jsxs("div", { className: "mt-2", children: [_jsxs("p", { className: `text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`, children: [_jsx("span", { className: "font-medium", children: "Product:" }), " ", productFound.name] }), _jsxs("p", { className: `text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`, children: [_jsx("span", { className: "font-medium", children: "Current Stock:" }), " ", productFound.stock, " units"] }), _jsxs("p", { className: `text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`, children: [_jsx("span", { className: "font-medium", children: "Price:" }), " $", productFound.selling_price?.toFixed(2) || '0.00'] }), _jsx("p", { className: `text-sm mt-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`, children: "Would you like to adjust stock for this product?" }), _jsxs("div", { className: "mt-4 flex space-x-3", children: [_jsx("button", { type: "button", onClick: handleGoToStockAdjustment, className: `
                                    flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                                    ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                  `, children: "Yes, Adjust Stock" }), _jsx("button", { type: "button", onClick: handleContinueScanning, className: `
                                    flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium
                                    ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'}
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                  `, children: "No, Continue Scanning" })] })] })) : (_jsxs("div", { className: "mt-2", children: [_jsx("p", { className: `text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`, children: "No product found with this barcode. Would you like to add it as a new product?" }), _jsxs("div", { className: "mt-4 flex space-x-3", children: [_jsx("button", { type: "button", onClick: handleAddProduct, className: `
                                    flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                                    ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                  `, children: "Yes, Add New Product" }), _jsx("button", { type: "button", onClick: handleContinueScanning, className: `
                                    flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium
                                    ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'}
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                  `, children: "No, Continue Scanning" })] })] }))] }) })), !showConfirmation && (_jsxs("div", { className: "mt-4 flex space-x-4", children: [_jsxs("button", { type: "button", onClick: () => setScanMode('camera'), disabled: !hasCamera, className: `
                            flex-1 py-2 px-4 rounded-md text-sm font-medium 
                            ${scanMode === 'camera'
                                                            ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`
                                                            : `${isDarkMode
                                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                            ${!hasCamera ? 'opacity-50 cursor-not-allowed' : ''}
                            transition-colors duration-150 ease-in-out
                          `, children: [_jsx(CameraIcon, { className: "h-5 w-5 inline mr-2" }), "Camera"] }), _jsxs("button", { type: "button", onClick: () => setScanMode('manual'), className: `
                            flex-1 py-2 px-4 rounded-md text-sm font-medium
                            ${scanMode === 'manual'
                                                            ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`
                                                            : `${isDarkMode
                                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                            transition-colors duration-150 ease-in-out
                          `, children: [_jsx(PencilIcon, { className: "h-5 w-5 inline mr-2" }), "Manual Entry"] })] })), scanMode === 'camera' && !showConfirmation && (_jsxs("div", { className: "mt-4", children: [hasCamera ? (_jsx("div", { id: "scanner-container", ref: videoContainerRef, className: "rounded-lg overflow-hidden bg-gray-900 w-full h-64 flex items-center justify-center", children: _jsx("div", { className: "text-white text-center", children: isScanning ? 'Position barcode in the camera view' : 'Starting camera...' }) })) : (_jsx("div", { className: `p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`, children: _jsx("p", { className: `text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`, children: "No camera detected. Please use manual entry instead." }) })), lastScanResults.length > 0 && (_jsxs("div", { className: `mt-4 p-3 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`, children: [_jsx("h4", { className: `text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`, children: "Recent Scans" }), _jsx("div", { className: "max-h-32 overflow-y-auto", children: lastScanResults.map((result, idx) => (_jsxs("div", { className: `
                                    flex items-center justify-between py-1 text-xs
                                    ${idx > 0 ? 'border-t border-opacity-25' : ''}
                                    ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}
                                  `, children: [_jsx("div", { children: _jsx("span", { className: `font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`, children: result.barcode }) }), _jsx("div", { children: result.product ? (_jsxs("span", { className: `px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800'}`, children: ["Found: ", result.product.name] })) : (_jsx("span", { className: `px-2 py-1 rounded-full ${isDarkMode ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-100 text-yellow-800'}`, children: "Not Found" })) })] }, idx))) })] }))] })), scanMode === 'manual' && !showConfirmation && (_jsx("div", { className: "mt-4", children: _jsxs("div", { className: `p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`, children: [_jsx("label", { htmlFor: "manual-barcode", className: `block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`, children: "Enter Barcode Manually" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { type: "text", id: "manual-barcode", value: manualBarcode, onChange: (e) => setManualBarcode(e.target.value), className: `
                                block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                                ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : ''}
                              `, placeholder: "Enter barcode number", onKeyDown: (e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleManualEntry();
                                                                        }
                                                                    } }), _jsx("button", { type: "button", onClick: handleManualEntry, className: `
                                inline-flex items-center px-4 py-2 border border-transparent 
                                text-sm font-medium rounded-md shadow-sm text-white
                                ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                              `, children: "Submit" })] })] }) }))] }) }) }) })] }) }))] }));
};
export default UnifiedBarcodeScanner;

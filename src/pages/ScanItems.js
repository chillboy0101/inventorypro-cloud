import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrReader } from 'react-qr-reader';
import { productsApi } from '../lib/api';
const ScanItems = () => {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(true);
    const [error, setError] = useState(null);
    const [scannedProduct, setScannedProduct] = useState(null);
    const handleScan = async (result) => {
        if (!result || !result.text)
            return;
        try {
            setScanning(false);
            const sku = result.text;
            const product = await productsApi.getBySku(sku);
            if (product) {
                setScannedProduct(product);
            }
            else {
                setError(`No product found with SKU: ${sku}`);
            }
        }
        catch (err) {
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
    return (_jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Scan Items" }), error && (_jsx("div", { className: "mb-4 bg-red-50 p-4 rounded-md", children: _jsx("p", { className: "text-sm text-red-700", children: error }) })), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [scanning ? (_jsxs("div", { className: "aspect-square max-w-md mx-auto", children: [_jsx(QrReader, { constraints: { facingMode: 'environment' }, onResult: handleScan, className: "w-full" }), _jsx("p", { className: "mt-4 text-sm text-gray-600 text-center", children: "Position the barcode/QR code in the center of the camera view" })] })) : scannedProduct ? (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Scanned Product" }), _jsx("div", { className: "border rounded-lg p-4", children: _jsxs("dl", { className: "grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Name" }), _jsx("dd", { className: "mt-1 text-sm text-gray-900", children: scannedProduct.name })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "SKU" }), _jsx("dd", { className: "mt-1 text-sm text-gray-900", children: scannedProduct.sku })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Current Stock" }), _jsx("dd", { className: "mt-1 text-sm text-gray-900", children: scannedProduct.quantity })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Price" }), _jsxs("dd", { className: "mt-1 text-sm text-gray-900", children: ["$", scannedProduct.price.toFixed(2)] })] })] }) })] })) : null, _jsxs("div", { className: "mt-6 flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: () => navigate('/inventory'), className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Done" }), !scanning && (_jsx("button", { type: "button", onClick: handleReset, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Scan Another" }))] })] })] }));
};
export default ScanItems;

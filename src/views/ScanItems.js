import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProduct } from '../store/slices/inventorySlice';
import { BarcodeScanner } from '../components/BarcodeScanner';
const ScanItems = () => {
    const dispatch = useDispatch();
    const products = useSelector((state) => state.inventory.items);
    const [scannedSku, setScannedSku] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    useEffect(() => {
        let timer;
        if (message) {
            timer = setTimeout(() => {
                setMessage(null);
            }, 3000);
        }
        return () => {
            if (timer)
                clearTimeout(timer);
        };
    }, [message]);
    const handleScan = async (sku) => {
        setScannedSku(sku);
        const product = products.find(p => p.sku === sku);
        if (!product) {
            setMessage({ type: 'error', text: `Product with SKU ${sku} not found` });
            return;
        }
        try {
            setIsSubmitting(true);
            await dispatch(updateProduct({
                id: product.id,
                stock: (product.stock || 0) + quantity
            })).unwrap();
            setMessage({ type: 'success', text: `Added ${quantity} units to ${product.name}` });
            setScannedSku('');
            setQuantity(1);
        }
        catch (error) {
            setMessage({ type: 'error', text: 'Failed to update quantity' });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!scannedSku)
            return;
        await handleScan(scannedSku);
    };
    return (_jsxs("div", { className: "max-w-2xl mx-auto p-6", children: [_jsx("div", { className: "md:flex md:items-center md:justify-between mb-6", children: _jsx("div", { className: "min-w-0 flex-1", children: _jsx("h2", { className: "text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight", children: "Scan Items" }) }) }), _jsx("div", { className: "bg-white shadow sm:rounded-lg", children: _jsxs("div", { className: "px-4 py-5 sm:p-6", children: [_jsx(BarcodeScanner, { onScan: handleScan, buttonText: "Scan Product" }), _jsxs("div", { className: "mt-8", children: [_jsx("h3", { className: "text-lg font-medium leading-6 text-gray-900", children: "Manual Entry" }), _jsxs("form", { onSubmit: handleManualSubmit, className: "mt-5 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "sku", className: "block text-sm font-medium text-gray-700", children: "SKU" }), _jsx("input", { type: "text", id: "sku", value: scannedSku, onChange: (e) => setScannedSku(e.target.value), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "quantity", className: "block text-sm font-medium text-gray-700", children: "Quantity" }), _jsx("input", { type: "number", id: "quantity", min: "1", value: quantity, onChange: (e) => setQuantity(parseInt(e.target.value) || 1), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" })] }), _jsx("div", { children: _jsx("button", { type: "submit", disabled: isSubmitting || !scannedSku, className: `inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${(isSubmitting || !scannedSku) ? 'opacity-50 cursor-not-allowed' : ''}`, children: isSubmitting ? 'Updating...' : 'Update Quantity' }) })] })] }), message && (_jsx("div", { className: `mt-4 rounded-md p-4 ${message.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`, children: _jsx("div", { className: "flex", children: _jsx("div", { className: "ml-3", children: _jsx("p", { className: `text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`, children: message.text }) }) }) }))] }) })] }));
};
export default ScanItems;

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { productsApi } from '../lib/api';
const ImportCSV = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState([]);
    const [fileName, setFileName] = useState('');
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
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
                setPreview(results.data);
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
                cost_price: parseFloat(row.price),
                selling_price: parseFloat(row.price),
                stock: parseInt(row.quantity),
                minimum_quantity: parseInt(row.minimum_quantity),
                category: row.category || 'Uncategorized',
                location: row.location || 'Default',
            }));
            // Import products in batches
            for (const product of products) {
                await productsApi.create(product);
            }
            navigate('/products');
        }
        catch (err) {
            console.error('Error importing products:', err);
            setError(err instanceof Error ? err.message : 'Failed to import products');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Import Products from CSV" }), error && (_jsx("div", { className: "mb-4 bg-red-50 p-4 rounded-md", children: _jsx("p", { className: "text-sm text-red-700", children: error }) })), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Upload CSV File" }), _jsx("div", { className: "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md", children: _jsxs("div", { className: "space-y-1 text-center", children: [_jsx("svg", { className: "mx-auto h-12 w-12 text-gray-400", stroke: "currentColor", fill: "none", viewBox: "0 0 48 48", "aria-hidden": "true", children: _jsx("path", { d: "M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }) }), _jsxs("div", { className: "flex text-sm text-gray-600", children: [_jsxs("label", { htmlFor: "file-upload", className: "relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500", children: [_jsx("span", { children: "Upload a file" }), _jsx("input", { id: "file-upload", name: "file-upload", type: "file", accept: ".csv", className: "sr-only", ref: fileInputRef, onChange: handleFileChange })] }), _jsx("p", { className: "pl-1", children: "or drag and drop" })] }), _jsx("p", { className: "text-xs text-gray-500", children: "CSV file up to 10MB" })] }) })] }), fileName && (_jsxs("p", { className: "text-sm text-gray-600 mb-4", children: ["Selected file: ", fileName] })), preview.length > 0 && (_jsxs(_Fragment, { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Preview" }), _jsxs("div", { className: "overflow-x-auto", children: [_jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "SKU" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Price" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Quantity" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: preview.slice(0, 5).map((row, index) => (_jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: row.name }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: row.sku }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: ["$", row.price] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: row.quantity })] }, index))) })] }), preview.length > 5 && (_jsxs("p", { className: "mt-2 text-sm text-gray-500", children: ["Showing 5 of ", preview.length, " items"] }))] })] })), _jsxs("div", { className: "mt-6 flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: () => navigate('/products'), className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Cancel" }), _jsx("button", { type: "button", onClick: handleImport, disabled: loading || !preview.length, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: loading ? 'Importing...' : 'Import Products' })] })] })] }));
};
export default ImportCSV;

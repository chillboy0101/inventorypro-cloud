import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '../lib/api';
const AddProduct = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        price: '',
        quantity: '',
        minimum_quantity: '',
        category: 'Uncategorized',
        location: 'Default',
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Destructure to avoid spreading invalid properties
            const { name, sku, description } = formData;
            await productsApi.create({
                name,
                sku,
                description,
                cost_price: parseFloat(formData.price || '0'),
                selling_price: parseFloat(formData.price || '0'),
                stock: parseInt(formData.quantity || '0'),
                reorder_level: parseInt(formData.minimum_quantity || '0'),
                category: formData.category || 'Uncategorized',
                location: formData.location || 'Default',
            });
            navigate('/products');
        }
        catch (err) {
            console.error('Error creating product:', err);
            setError(err instanceof Error ? err.message : 'Failed to create product');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Add New Product" }), error && (_jsx("div", { className: "mb-4 bg-red-50 p-4 rounded-md", children: _jsx("p", { className: "text-sm text-red-700", children: error }) })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 bg-white p-6 rounded-lg shadow", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700", children: "Product Name" }), _jsx("input", { type: "text", name: "name", id: "name", required: true, value: formData.name, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "sku", className: "block text-sm font-medium text-gray-700", children: "SKU" }), _jsx("input", { type: "text", name: "sku", id: "sku", required: true, value: formData.sku, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700", children: "Description" }), _jsx("textarea", { name: "description", id: "description", rows: 3, value: formData.description, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "price", className: "block text-sm font-medium text-gray-700", children: "Price" }), _jsx("input", { type: "number", name: "price", id: "price", required: true, min: "0", step: "0.01", value: formData.price, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "quantity", className: "block text-sm font-medium text-gray-700", children: "Quantity" }), _jsx("input", { type: "number", name: "quantity", id: "quantity", required: true, min: "0", value: formData.quantity, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "minimum_quantity", className: "block text-sm font-medium text-gray-700", children: "Minimum Quantity" }), _jsx("input", { type: "number", name: "minimum_quantity", id: "minimum_quantity", required: true, min: "0", value: formData.minimum_quantity, onChange: handleChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: () => navigate('/products'), className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: loading ? 'Creating...' : 'Create Product' })] })] })] }));
};
export default AddProduct;

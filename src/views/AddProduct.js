import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createProduct } from '../store/slices/inventorySlice';
const AddProduct = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [product, setProduct] = useState({
        name: '',
        sku: '',
        cost_price: 0,
        selling_price: 0,
        location: '',
        minimum_quantity: 0,
        category: ''
    });
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await dispatch(createProduct(product)).unwrap();
            navigate('/products');
        }
        catch (error) {
            console.error('Failed to create product:', error);
            alert('Failed to create product. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "max-w-2xl mx-auto p-6", children: [_jsx("div", { className: "md:flex md:items-center md:justify-between mb-6", children: _jsx("div", { className: "min-w-0 flex-1", children: _jsx("h2", { className: "text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight", children: "Add New Product" }) }) }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700", children: "Product Name" }), _jsx("input", { type: "text", id: "name", name: "name", value: product.name, onChange: handleInputChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "sku", className: "block text-sm font-medium text-gray-700", children: "SKU" }), _jsx("input", { type: "text", id: "sku", name: "sku", value: product.sku, onChange: handleInputChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "cost_price", className: "block text-sm font-medium text-gray-700", children: "Cost Price" }), _jsx("input", { type: "number", step: "0.01", id: "cost_price", name: "cost_price", value: product.cost_price, onChange: handleInputChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "selling_price", className: "block text-sm font-medium text-gray-700", children: "Selling Price" }), _jsx("input", { type: "number", step: "0.01", id: "selling_price", name: "selling_price", value: product.selling_price, onChange: handleInputChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "location", className: "block text-sm font-medium text-gray-700", children: "Location" }), _jsx("input", { type: "text", id: "location", name: "location", value: product.location, onChange: handleInputChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "minimum_quantity", className: "block text-sm font-medium text-gray-700", children: "Minimum Quantity" }), _jsx("input", { type: "number", id: "minimum_quantity", name: "minimum_quantity", value: product.minimum_quantity, onChange: handleInputChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "category", className: "block text-sm font-medium text-gray-700", children: "Category" }), _jsx("input", { type: "text", id: "category", name: "category", value: product.category, onChange: handleInputChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700", children: "Description" }), _jsx("textarea", { id: "description", name: "description", value: product.description || '', onChange: handleInputChange, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", rows: 3 })] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: () => navigate('/products'), className: "rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2", children: "Cancel" }), _jsx("button", { type: "submit", disabled: isSubmitting, className: `rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`, children: isSubmitting ? (_jsxs("span", { className: "flex items-center", children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Adding..."] })) : ('Add Product') })] })] })] }));
};
export default AddProduct;

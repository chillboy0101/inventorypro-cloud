import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, fetchLocations } from '../store/slices/inventorySlice';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SerialNumberManager from './SerialNumberManager';
import RemoveSerialsModal from './RemoveSerialsModal';
import { supabase } from '../lib/supabase';
export default function EditProductForm({ product, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const categories = useSelector((state) => state.inventory.categories);
    const locations = useSelector((state) => state.inventory.locations);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showSerialManager, setShowSerialManager] = useState(false);
    const [showRemoveSerials, setShowRemoveSerials] = useState(false);
    const [formData, setFormData] = useState({
        name: product.name,
        description: product.description || '',
        sku: product.sku,
        category: product.category,
        stock: product.stock,
        cost_price: product.cost_price !== undefined && product.cost_price !== null ? String(product.cost_price) : '',
        selling_price: product.selling_price !== undefined && product.selling_price !== null ? String(product.selling_price) : '',
        location: product.location,
        reorder_level: product.reorder_level,
        is_serialized: product.is_serialized
    });
    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchLocations());
    }, [dispatch]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: name === 'stock' || name === 'reorder_level'
                    ? Number(value) || 0
                    : name === 'cost_price' || name === 'selling_price'
                        ? value
                        : value
            };
            return newData;
        });
        setError(null);
    };
    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        let cleaned = value.replace(/^0+(?!\.)/, '');
        cleaned = cleaned.replace(/[^\d.]/g, '');
        setFormData(prev => ({
            ...prev,
            [name]: cleaned
        }));
    };
    const handlePriceBlur = (e) => {
        const { name, value } = e.target;
        let num = parseFloat(value);
        if (isNaN(num))
            num = 0;
        let formatted = num < 1 && num > 0 ? num.toFixed(2) : String(num);
        if (!formatted.includes('.'))
            formatted += '.00';
        else if (/\.\d$/.test(formatted))
            formatted += '0';
        setFormData(prev => ({ ...prev, [name]: formatted }));
    };
    const handlePriceFocus = () => {
        // No need to update priceFocus as it's not used
    };
    const handleReorderLevelChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            reorder_level: Number(value)
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            // For serialized products, stock is managed through serial numbers
            if (formData.is_serialized) {
                const currentStock = Number(product.stock);
                const newStock = Number(formData.stock);
                if (newStock > currentStock) {
                    // Need to add serials
                    setShowSerialManager(true);
                    return;
                }
                else if (newStock < currentStock) {
                    // Need to remove serials
                    setShowRemoveSerials(true);
                    return;
                }
            }
            const { error: updateError } = await supabase
                .from('products')
                .update({
                name: formData.name,
                description: formData.description,
                category: formData.category,
                cost_price: formData.cost_price === '' ? null : Number(formData.cost_price),
                selling_price: formData.selling_price === '' ? null : Number(formData.selling_price),
                stock: formData.is_serialized ? Number(product.stock) : Number(formData.stock),
                reorder_level: formData.reorder_level,
                is_serialized: formData.is_serialized,
                updated_at: new Date().toISOString()
            })
                .eq('id', product.id);
            if (updateError)
                throw updateError;
            setSuccess('Product updated successfully');
            onSuccess();
        }
        catch (err) {
            console.error('Error updating product:', err);
            setError('Failed to update product');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleSerialsAdded = async () => {
        setShowSerialManager(false);
        const formEvent = new Event('submit');
        await handleSubmit(formEvent);
    };
    const handleSerialsRemoved = async () => {
        setShowRemoveSerials(false);
        const formEvent = new Event('submit');
        await handleSubmit(formEvent);
    };
    return (_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-2xl w-full", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Edit Product" }), _jsx("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-700", children: _jsx(XMarkIcon, { className: "h-6 w-6" }) })] }), error && (_jsx("div", { className: "mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md", children: error })), success && (_jsx("div", { className: "mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md", children: success })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700", children: "Product Name" }), _jsx("input", { type: "text", id: "name", name: "name", value: formData.name, onChange: handleChange, className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true, disabled: isSubmitting })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "sku", className: "block text-sm font-medium text-gray-700", children: "SKU" }), _jsx("input", { type: "text", id: "sku", name: "sku", value: formData.sku, className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm", readOnly: true, disabled: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "category", className: "block text-sm font-medium text-gray-700", children: "Category" }), _jsxs("select", { id: "category", name: "category", value: formData.category, onChange: handleChange, className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true, disabled: isSubmitting, children: [_jsx("option", { value: "", children: "Select Category" }), categories.map((category) => (_jsx("option", { value: category, children: category }, category)))] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "location", className: "block text-sm font-medium text-gray-700", children: "Location" }), _jsxs("select", { id: "location", name: "location", value: formData.location, onChange: handleChange, className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true, disabled: isSubmitting, children: [_jsx("option", { value: "", children: "Select Location" }), locations.map((location) => (_jsx("option", { value: location, children: location }, location)))] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "stock", className: "block text-sm font-medium text-gray-700", children: "Stock" }), _jsx("input", { type: "number", id: "stock", name: "stock", value: formData.stock, onChange: handleChange, min: "0", step: "1", className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true, disabled: formData.is_serialized }), formData.is_serialized && (_jsx("div", { className: "text-xs text-blue-600 mt-1", children: "Stock is managed automatically based on serial numbers. To change stock, add or remove serial numbers." }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "cost_price", className: "block text-sm font-medium text-gray-700", children: "Cost Price" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-2 top-1/2 -translate-y-1/2 text-gray-500", children: "$" }), _jsx("input", { type: "text", id: "cost_price", name: "cost_price", min: "0", step: "0.01", placeholder: "0.00", value: formData.cost_price === '' ? '' : String(formData.cost_price), onChange: handlePriceChange, onBlur: handlePriceBlur, onFocus: handlePriceFocus, className: "mt-1 block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true })] }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "The price you pay to acquire the product" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "selling_price", className: "block text-sm font-medium text-gray-700", children: "Selling Price" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-2 top-1/2 -translate-y-1/2 text-gray-500", children: "$" }), _jsx("input", { type: "text", id: "selling_price", name: "selling_price", min: "0", step: "0.01", placeholder: "0.00", value: formData.selling_price === '' ? '' : String(formData.selling_price), onChange: handlePriceChange, onBlur: handlePriceBlur, onFocus: handlePriceFocus, className: `mt-1 block w-full pl-7 border rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${Number(formData.selling_price) <= Number(formData.cost_price) ? 'border-red-300' : 'border-gray-300'}`, required: true })] }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "The price customers will pay for the product" }), Number(formData.selling_price) <= Number(formData.cost_price) && (_jsx("p", { className: "mt-1 text-xs text-red-500", children: "Selling price should be higher than cost price for profit" }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "reorder_level", className: "block text-sm font-medium text-gray-700", children: "Reorder Level" }), _jsx("input", { type: "text", id: "reorder_level", name: "reorder_level", value: Number(formData.reorder_level) === 0 ? '' : String(formData.reorder_level ?? ''), onChange: handleReorderLevelChange, min: "0", className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700", children: "Description" }), _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleChange, rows: 3, className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", disabled: isSubmitting })] })] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", disabled: isSubmitting, children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", disabled: isSubmitting, children: isSubmitting ? (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" }), "Saving..."] })) : ('Save Changes') })] })] }), showSerialManager && (_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4", children: _jsx(SerialNumberManager, { productId: product.id, initialCount: Number(formData.stock), onClose: handleSerialsAdded }) })), showRemoveSerials && (_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4", children: _jsx(RemoveSerialsModal, { productId: product.id, onDone: handleSerialsRemoved, onClose: () => setShowRemoveSerials(false) }) }))] }) }));
}

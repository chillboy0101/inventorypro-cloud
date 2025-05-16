import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, fetchCategories, fetchLocations, addCategory, addLocation } from '../store/slices/inventorySlice';
import { XMarkIcon } from '@heroicons/react/24/outline';
const AddProductForm = ({ onClose, initialSku = '', initialProductData = {}, onProductCreated }) => {
    const dispatch = useDispatch();
    const categories = useSelector((state) => state.inventory.categories);
    const locations = useSelector((state) => state.inventory.locations);
    const products = useSelector((state) => state.inventory.items);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [showNewLocation, setShowNewLocation] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [newLocation, setNewLocation] = useState('');
    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchLocations());
    }, [dispatch]);
    const [formData, setFormData] = useState({
        name: initialProductData.name || '',
        description: '',
        sku: initialSku,
        category: initialProductData.category || '',
        stock: initialProductData.stock || 0,
        cost_price: initialProductData.cost_price || 0,
        selling_price: initialProductData.selling_price || 0,
        location: initialProductData.location || '',
        reorder_level: 10,
        custom_icon: '',
        custom_icon_type: 'default',
        is_serialized: false
    });
    useEffect(() => {
        if (!initialSku && formData.category && formData.name) {
            const prefix = formData.category.slice(0, 2).toUpperCase();
            const existingSkus = products
                .filter(p => p.category === formData.category)
                .map(p => p.sku)
                .filter(sku => sku.startsWith(prefix))
                .map(sku => {
                const num = parseInt(sku.slice(3));
                return isNaN(num) ? 0 : num;
            });
            const maxNum = Math.max(0, ...existingSkus);
            const nextNum = maxNum + 1;
            const sku = `${prefix}-${String(nextNum).padStart(3, '0')}`;
            setFormData(prev => ({ ...prev, sku }));
        }
    }, [formData.category, formData.name, products, initialSku]);
    const formatInteger = (value) => {
        // Remove leading zeros, allow only numbers
        return value.replace(/^0+(?=\d)/, '').replace(/[^\d]/g, '');
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: name === 'stock' || name === 'cost_price' || name === 'selling_price' || name === 'reorder_level'
                    ? parseFloat(value) || 0
                    : value
            };
            return newData;
        });
        setError(null);
    };
    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        // Remove leading zero if present and not immediately followed by a dot
        let cleaned = value.replace(/^0+(?!\.)/, '');
        // Allow only numbers and dot
        cleaned = cleaned.replace(/[^\d.]/g, '');
        setFormData(prev => ({
            ...prev,
            [name]: cleaned
        }));
    };
    const handlePriceBlur = (e) => {
        const { name, value } = e.target;
        if (value === '' || value === '0' || value === '0.00') {
            setFormData(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        else {
            let num = parseFloat(value);
            if (isNaN(num))
                num = 0;
            setFormData(prev => ({
                ...prev,
                [name]: num.toFixed(2)
            }));
        }
    };
    const handlePriceFocus = () => { };
    const handleStockChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            stock: parseInt(formatInteger(value)) || 0
        }));
    };
    const handleReorderLevelChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            reorder_level: parseInt(formatInteger(value)) || 0
        }));
    };
    const handleNewCategorySubmit = (e) => {
        e.preventDefault();
        if (newCategory.trim()) {
            dispatch(addCategory(newCategory.trim()));
            setFormData({ ...formData, category: newCategory.trim() });
            setNewCategory('');
            setShowNewCategory(false);
        }
    };
    const handleNewLocationSubmit = (e) => {
        e.preventDefault();
        if (newLocation.trim()) {
            dispatch(addLocation(newLocation.trim()));
            setFormData({ ...formData, location: newLocation.trim() });
            setNewLocation('');
            setShowNewLocation(false);
        }
    };
    const validateForm = () => {
        if (!formData.name.trim())
            return 'Product name is required';
        if (!formData.sku.trim())
            return 'SKU is required';
        if (!formData.category.trim())
            return 'Category is required';
        if (!formData.location.trim())
            return 'Location is required';
        const costPrice = typeof formData.cost_price === 'string' ? parseFloat(formData.cost_price) || 0 : formData.cost_price;
        const sellingPrice = typeof formData.selling_price === 'string' ? parseFloat(formData.selling_price) || 0 : formData.selling_price;
        if (costPrice <= 0)
            return 'Cost price must be greater than 0';
        if (sellingPrice <= 0)
            return 'Selling price must be greater than 0';
        if (sellingPrice <= costPrice)
            return 'Selling price must be greater than cost price';
        if (formData.stock < 0)
            return 'Stock cannot be negative';
        if (formData.reorder_level < 0)
            return 'Reorder level cannot be negative';
        return null;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const result = await dispatch(createProduct({
                ...formData,
                cost_price: typeof formData.cost_price === 'string' ? parseFloat(formData.cost_price) || 0 : formData.cost_price,
                selling_price: typeof formData.selling_price === 'string' ? parseFloat(formData.selling_price) || 0 : formData.selling_price,
                description: formData.description || null
            })).unwrap();
            if (onProductCreated)
                onProductCreated(result);
            onClose();
        }
        catch (error) {
            console.error('Failed to create product:', error);
            setError(error instanceof Error ? error.message : 'Failed to create product. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Add New Product" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-500", children: _jsx(XMarkIcon, { className: "h-6 w-6" }) })] }), error && (_jsx("div", { className: "mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700", children: "Product Name" }), _jsx("input", { type: "text", id: "name", name: "name", value: formData.name, onChange: handleChange, className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "sku", className: "block text-sm font-medium text-gray-700", children: ["SKU ", initialSku ? '(from Barcode)' : '(Auto-generated)'] }), _jsx("input", { type: "text", id: "sku", name: "sku", value: formData.sku, onChange: initialSku ? handleChange : undefined, className: `mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 ${initialSku ? '' : 'bg-gray-50 text-gray-500'} sm:text-sm`, readOnly: !initialSku, disabled: !initialSku })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "category", className: "block text-sm font-medium text-gray-700", children: "Category" }), showNewCategory ? (_jsxs("div", { className: "mt-1 flex space-x-2", children: [_jsx("input", { type: "text", value: newCategory, onChange: (e) => setNewCategory(e.target.value), className: "block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", placeholder: "Enter new category" }), _jsx("button", { type: "button", onClick: handleNewCategorySubmit, className: "inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Add" }), _jsx("button", { type: "button", onClick: () => setShowNewCategory(false), className: "inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Cancel" })] })) : (_jsxs("div", { className: "mt-1 flex space-x-2", children: [_jsxs("select", { id: "category", name: "category", value: formData.category, onChange: handleChange, className: "block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true, children: [_jsx("option", { value: "", children: "Select Category" }), categories.map((category) => (_jsx("option", { value: category, children: category }, category)))] }), _jsx("button", { type: "button", onClick: () => setShowNewCategory(true), className: "inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Add" })] }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "location", className: "block text-sm font-medium text-gray-700", children: "Location" }), showNewLocation ? (_jsxs("div", { className: "mt-1 flex space-x-2", children: [_jsx("input", { type: "text", value: newLocation, onChange: (e) => setNewLocation(e.target.value), className: "block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", placeholder: "Enter new location" }), _jsx("button", { type: "button", onClick: handleNewLocationSubmit, className: "inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Add" }), _jsx("button", { type: "button", onClick: () => setShowNewLocation(false), className: "inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Cancel" })] })) : (_jsxs("div", { className: "mt-1 flex space-x-2", children: [_jsxs("select", { id: "location", name: "location", value: formData.location, onChange: handleChange, className: "block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true, children: [_jsx("option", { value: "", children: "Select Location" }), locations.map((location) => (_jsx("option", { value: location, children: location }, location)))] }), _jsx("button", { type: "button", onClick: () => setShowNewLocation(true), className: "inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Add" })] }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "stock", className: "block text-sm font-medium text-gray-700", children: "Stock" }), _jsx("input", { type: "text", id: "stock", name: "stock", value: formData.stock === 0 ? '' : formData.stock, onChange: handleStockChange, min: "0", className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "cost_price", className: "block text-sm font-medium text-gray-700", children: "Cost Price" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-2 top-1/2 -translate-y-1/2 text-gray-500", children: "$" }), _jsx("input", { type: "text", id: "cost_price", name: "cost_price", min: "0", step: "0.01", placeholder: "0.00", value: typeof formData.cost_price === 'number' ? (formData.cost_price === 0 ? '' : formData.cost_price) : (formData.cost_price === '' ? '' : formData.cost_price), onChange: handlePriceChange, onBlur: handlePriceBlur, onFocus: handlePriceFocus, className: "mt-1 block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true })] }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "The price you pay to acquire the product" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "selling_price", className: "block text-sm font-medium text-gray-700", children: "Selling Price" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-2 top-1/2 -translate-y-1/2 text-gray-500", children: "$" }), _jsx("input", { type: "text", id: "selling_price", name: "selling_price", min: "0", step: "0.01", placeholder: "0.00", value: typeof formData.selling_price === 'number' ? (formData.selling_price === 0 ? '' : formData.selling_price) : (formData.selling_price === '' ? '' : formData.selling_price), onChange: handlePriceChange, onBlur: handlePriceBlur, onFocus: handlePriceFocus, className: `mt-1 block w-full pl-7 border rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${Number(typeof formData.selling_price === 'number' ? formData.selling_price : parseFloat(formData.selling_price)) <= Number(typeof formData.cost_price === 'number' ? formData.cost_price : parseFloat(formData.cost_price)) ? 'border-red-300' : 'border-gray-300'}`, required: true })] }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "The price customers will pay for the product" }), Number(typeof formData.selling_price === 'number' ? formData.selling_price : parseFloat(formData.selling_price)) <= Number(typeof formData.cost_price === 'number' ? formData.cost_price : parseFloat(formData.cost_price)) && (_jsx("p", { className: "mt-1 text-xs text-red-500", children: "Selling price should be higher than cost price for profit" }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "reorder_level", className: "block text-sm font-medium text-gray-700", children: "Reorder Level" }), _jsx("input", { type: "text", id: "reorder_level", name: "reorder_level", value: formData.reorder_level === 0 ? '' : formData.reorder_level, onChange: handleReorderLevelChange, min: "0", className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700", children: "Description" }), _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleChange, rows: 3, className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "is_serialized", checked: formData.is_serialized, onChange: (e) => setFormData({ ...formData, is_serialized: e.target.checked }), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "is_serialized", className: "block text-sm font-medium text-gray-700", children: "This product requires serial numbers" })] }), formData.is_serialized && (_jsx("div", { className: "bg-blue-50 p-4 rounded-md", children: _jsx("p", { className: "text-sm text-blue-700", children: "Serial numbers will be required for each unit of this product. You'll be able to add serial numbers after creating the product." }) })), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", disabled: isSubmitting, children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", disabled: isSubmitting, children: isSubmitting ? (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" }), "Creating..."] })) : ('Create Product') })] })] })] }) }));
};
export default AddProductForm;

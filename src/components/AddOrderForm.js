import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder } from '../store/slices/ordersSlice';
import { fetchProducts } from '../store/slices/inventorySlice';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
export default function AddOrderForm({ onClose }) {
    const dispatch = useDispatch();
    const products = useSelector((state) => state.inventory.items);
    const [customer, setCustomer] = useState('');
    const [items, setItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [serialModal, setSerialModal] = useState(null);
    const [serialOptions, setSerialOptions] = useState([]);
    const [selectedSerials, setSelectedSerials] = useState([]);
    useEffect(() => {
        dispatch(fetchProducts());
    }, [dispatch]);
    const validateCustomer = (value) => {
        if (!value.trim()) {
            return 'Customer name is required';
        }
        if (value.trim().length < 2) {
            return 'Customer name must be at least 2 characters';
        }
        if (value.trim().length > 50) {
            return 'Customer name must be less than 50 characters';
        }
        return null;
    };
    const validateQuantity = (productId, requestedQuantity) => {
        const product = products.find(p => p.id === productId);
        if (!product) {
            return 'Product not found';
        }
        // Check if we already have this product in our order
        const existingItem = items.find(item => item.product_id === productId);
        const totalRequestedQuantity = (existingItem?.quantity || 0) + requestedQuantity;
        if (totalRequestedQuantity > product.stock) {
            return `Insufficient stock. Only ${product.stock} units available.`;
        }
        if (requestedQuantity <= 0) {
            return 'Quantity must be greater than 0';
        }
        return null;
    };
    const handleAddItem = async () => {
        if (!selectedProduct) {
            setError('Please select a product');
            return;
        }
        const product = products.find(p => p.id === selectedProduct);
        if (!product) {
            setError('Selected product not found');
            return;
        }
        if (product.is_serialized) {
            // Fetch available serials
            const { data } = await supabase.from('serial_numbers').select('id, serial_number').eq('product_id', product.id).eq('status', 'available');
            setSerialOptions(data || []);
            setSelectedSerials([]);
            setSerialModal({ productId: product.id, quantity, onDone: (serials) => {
                    // Add item with serials
                    const newItem = {
                        product_id: product.id,
                        quantity,
                        price: typeof product.selling_price === 'number' ? product.selling_price : 0,
                        serial_numbers: serials
                    };
                    setItems(prev => [...prev, newItem]);
                    setSerialModal(null);
                    setSelectedProduct('');
                    setQuantity(1);
                    setError(null);
                } });
            return;
        }
        const quantityError = validateQuantity(selectedProduct, quantity);
        if (quantityError) {
            setError(quantityError);
            return;
        }
        // Check if product already exists in order
        const existingItemIndex = items.findIndex(item => item.product_id === selectedProduct);
        if (existingItemIndex !== -1) {
            // Update existing item quantity
            const updatedItems = [...items];
            updatedItems[existingItemIndex].quantity += quantity;
            setItems(updatedItems);
        }
        else {
            // Add new item
            const newItem = {
                product_id: product.id,
                quantity,
                price: typeof product.selling_price === 'number' ? product.selling_price : 0
            };
            setItems(prev => [...prev, newItem]);
        }
        setSelectedProduct('');
        setQuantity(1);
        setError(null);
    };
    const handleRemoveItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };
    const calculateTotals = () => {
        return items.reduce((acc, item) => {
            const total = item.price * item.quantity;
            return {
                items: acc.items + item.quantity,
                amount: acc.amount + total
            };
        }, { items: 0, amount: 0 });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate customer name
        const customerError = validateCustomer(customer);
        if (customerError) {
            setError(customerError);
            return;
        }
        // Validate items
        if (items.length === 0) {
            setError('Please add at least one item to the order');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const { items: totalItems, amount: totalAmount } = calculateTotals();
            const result = await dispatch(createOrder({
                customer: customer.trim(),
                status: 'pending',
                total_items: totalItems,
                total_amount: totalAmount,
                items: items
            })).unwrap();
            console.log('Order created successfully:', result);
            onClose();
        }
        catch (error) {
            console.error('Failed to create order:', error);
            setError(error instanceof Error ? error.message : 'Failed to create order. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const getProductById = (id) => {
        return products.find(p => p.id === id);
    };
    return (_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-2xl w-full", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Add New Order" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-500", children: _jsx(XMarkIcon, { className: "h-6 w-6" }) })] }), error && (_jsx("div", { className: "mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "customer", className: "block text-sm font-medium text-gray-700", children: "Customer Name" }), _jsx("input", { type: "text", id: "customer", value: customer, onChange: (e) => {
                                        setCustomer(e.target.value);
                                        setError(null);
                                    }, className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", required: true })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 mb-2", children: "Add Items" }), _jsxs("div", { className: "flex space-x-4", children: [_jsxs("select", { value: selectedProduct, onChange: (e) => {
                                                setSelectedProduct(e.target.value);
                                                setError(null);
                                            }, className: "block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", children: [_jsx("option", { value: "", children: "Select Product" }), products.map(product => {
                                                    const existingItem = items.find(item => item.product_id === product.id);
                                                    const remainingStock = product.stock - (existingItem?.quantity || 0);
                                                    return (_jsxs("option", { value: product.id, disabled: remainingStock <= 0, children: [product.name, " - $", product.selling_price?.toFixed(2) || '0.00', " (Stock: ", remainingStock, ")"] }, product.id));
                                                })] }), (() => {
                                            const product = products.find(p => p.id === selectedProduct);
                                            const maxQty = product ? product.stock - (items.find(item => item.product_id === selectedProduct)?.quantity || 0) : 1;
                                            return (_jsx("input", { type: "number", min: "1", max: maxQty, value: quantity, onChange: (e) => {
                                                    setQuantity(parseInt(e.target.value) || 0);
                                                    setError(null);
                                                }, className: "block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", placeholder: "Qty" }));
                                        })(), _jsx("button", { type: "button", onClick: handleAddItem, disabled: !selectedProduct || quantity <= 0, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: "Add" })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 mb-2", children: "Order Items" }), _jsx("div", { className: "border rounded-md overflow-hidden", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Product" }), _jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Quantity" }), _jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Price" }), _jsx("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Total" }), _jsx("th", { scope: "col", className: "relative px-6 py-3", children: _jsx("span", { className: "sr-only", children: "Actions" }) })] }) }), _jsxs("tbody", { className: "bg-white divide-y divide-gray-200", children: [items.map((item, index) => {
                                                        const product = getProductById(item.product_id);
                                                        return (_jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: product?.name }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: item.quantity }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: ["$", item.price.toFixed(2)] }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: ["$", (item.quantity * item.price).toFixed(2)] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsx("button", { type: "button", onClick: () => handleRemoveItem(index), className: "text-red-600 hover:text-red-900", children: "Remove" }) })] }, index));
                                                    }), items.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-6 py-4 text-center text-sm text-gray-500", children: "No items added yet" }) }))] }), items.length > 0 && (_jsx("tfoot", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("td", { colSpan: 3, className: "px-6 py-4 text-right text-sm font-medium text-gray-900", children: "Total:" }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: ["$", calculateTotals().amount.toFixed(2)] }), _jsx("td", {})] }) }))] }) })] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", children: "Cancel" }), _jsx("button", { type: "submit", disabled: isSubmitting || items.length === 0, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: isSubmitting ? 'Creating...' : 'Create Order' })] })] }), serialModal !== null && (_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full", children: [_jsx("h3", { className: "text-lg font-medium mb-2", children: "Select Serial Numbers" }), _jsxs("p", { className: "mb-2 text-sm text-gray-600", children: ["Select ", serialModal.quantity, " serial number(s):"] }), _jsx("div", { className: "mb-4 max-h-48 overflow-y-auto", children: serialOptions.map(opt => (_jsxs("label", { className: "flex items-center space-x-2 mb-1", children: [_jsx("input", { type: "checkbox", value: opt.id, checked: selectedSerials.includes(opt.id), onChange: e => {
                                                if (e.target.checked && selectedSerials.length < serialModal.quantity) {
                                                    setSelectedSerials([...selectedSerials, opt.id]);
                                                }
                                                else if (!e.target.checked) {
                                                    setSelectedSerials(selectedSerials.filter(id => id !== opt.id));
                                                }
                                            }, disabled: !selectedSerials.includes(opt.id) && selectedSerials.length >= serialModal.quantity }), _jsx("span", { children: opt.serial_number })] }, opt.id))) }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx("button", { onClick: () => setSerialModal(null), className: "px-3 py-1 bg-gray-200 rounded", children: "Cancel" }), _jsx("button", { onClick: () => serialModal.onDone(selectedSerials), className: "px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50", disabled: selectedSerials.length !== serialModal.quantity, children: "Confirm" })] })] }) }))] }) }));
}

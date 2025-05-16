import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/slices/inventorySlice';
import { fetchStockAdjustments, createStockAdjustment } from '../store/slices/stockAdjustmentsSlice';
import { PlusIcon, XMarkIcon, } from '@heroicons/react/24/outline';
const ITEMS_PER_PAGE = 10;
export default function StockAdjustments() {
    const dispatch = useDispatch();
    const products = useSelector((state) => state.inventory.items);
    const { items: adjustments, loading } = useSelector((state) => state.stockAdjustments);
    // State for modal and form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [adjustmentType, setAdjustmentType] = useState('in');
    const [reason, setReason] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    useEffect(() => {
        dispatch(fetchProducts());
        dispatch(fetchStockAdjustments());
    }, [dispatch]);
    const handleCreateAdjustment = async () => {
        if (!selectedProduct) {
            alert('Please select a product');
            return;
        }
        if (quantity <= 0) {
            alert('Quantity must be greater than 0');
            return;
        }
        if (!reason.trim()) {
            alert('Please provide a reason for the adjustment');
            return;
        }
        try {
            await dispatch(createStockAdjustment({
                product_id: selectedProduct,
                quantity,
                adjustment_type: adjustmentType,
                reason: reason.trim()
            })).unwrap();
            // Reset form and close modal
            setIsModalOpen(false);
            setSelectedProduct('');
            setQuantity(0);
            setAdjustmentType('in');
            setReason('');
        }
        catch (error) {
            console.error('Failed to create stock adjustment:', error);
            alert(error instanceof Error ? error.message : 'Failed to create stock adjustment');
        }
    };
    // Filter adjustments based on search query
    const filteredAdjustments = adjustments.filter(adjustment => {
        const product = products.find(p => p.id === adjustment.product_id);
        const searchLower = searchQuery.toLowerCase();
        return (product?.name.toLowerCase().includes(searchLower) ||
            product?.sku.toLowerCase().includes(searchLower) ||
            adjustment.reason.toLowerCase().includes(searchLower));
    });
    // Pagination
    const totalPages = Math.ceil(filteredAdjustments.length / ITEMS_PER_PAGE);
    const paginatedAdjustments = filteredAdjustments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" }) }));
    }
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "sm:flex sm:items-center", children: [_jsxs("div", { className: "sm:flex-auto", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Stock Adjustments" }), _jsx("p", { className: "mt-2 text-sm text-gray-700", children: "A list of all stock adjustments including reason, quantity changes, and timestamps." })] }), _jsx("div", { className: "mt-4 sm:mt-0 sm:ml-16 sm:flex-none", children: _jsxs("button", { type: "button", onClick: () => setIsModalOpen(true), className: "inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto", children: [_jsx(PlusIcon, { className: "-ml-1 mr-2 h-5 w-5", "aria-hidden": "true" }), "New Adjustment"] }) })] }), _jsx("div", { className: "mt-4", children: _jsx("div", { className: "max-w-md", children: _jsx("input", { type: "text", value: searchQuery, onChange: (e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }, placeholder: "Search adjustments...", className: "block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" }) }) }), _jsx("div", { className: "mt-8 flex flex-col", children: _jsx("div", { className: "-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8", children: _jsx("div", { className: "inline-block min-w-full py-2 align-middle md:px-6 lg:px-8", children: _jsx("div", { className: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "ID" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Product" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Type" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Quantity" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Previous Stock" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "New Stock" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Reason" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Date" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200 bg-white", children: paginatedAdjustments.map((adjustment) => {
                                            const product = products.find(p => p.id === adjustment.product_id);
                                            return (_jsxs("tr", { children: [_jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: adjustment.id }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-900", children: product?.name || 'Deleted Product' }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${adjustment.adjustment_type === 'in'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'}`, children: adjustment.adjustment_type === 'in' ? 'Stock In' : 'Stock Out' }) }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: adjustment.quantity }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: adjustment.previous_quantity }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: adjustment.new_quantity }), _jsx("td", { className: "px-3 py-4 text-sm text-gray-500", children: adjustment.reason }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: new Date(adjustment.created_at).toLocaleString() })] }, adjustment.id));
                                        }) })] }) }) }) }) }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex-1 text-sm text-gray-700", children: ["Showing ", _jsx("span", { className: "font-medium", children: ((currentPage - 1) * ITEMS_PER_PAGE) + 1 }), " to", ' ', _jsx("span", { className: "font-medium", children: Math.min(currentPage * ITEMS_PER_PAGE, filteredAdjustments.length) }), ' ', "of ", _jsx("span", { className: "font-medium", children: filteredAdjustments.length }), " adjustments"] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => setCurrentPage(prev => Math.max(1, prev - 1)), disabled: currentPage === 1, className: "px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50", children: "Previous" }), _jsx("button", { onClick: () => setCurrentPage(prev => Math.min(totalPages, prev + 1)), disabled: currentPage === totalPages, className: "px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50", children: "Next" })] })] }), isModalOpen && (_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-lg font-medium", children: "New Stock Adjustment" }), _jsx("button", { onClick: () => setIsModalOpen(false), className: "text-gray-400 hover:text-gray-500", children: _jsx(XMarkIcon, { className: "h-6 w-6" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Product" }), _jsxs("select", { value: selectedProduct, onChange: (e) => setSelectedProduct(e.target.value), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", children: [_jsx("option", { value: "", children: "Select a product" }), products.map((product) => (_jsxs("option", { value: product.id, children: [product.name, " (Current Stock: ", product.stock, ")"] }, product.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Adjustment Type" }), _jsxs("select", { value: adjustmentType, onChange: (e) => setAdjustmentType(e.target.value), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", children: [_jsx("option", { value: "in", children: "Stock In" }), _jsx("option", { value: "out", children: "Stock Out" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Quantity" }), _jsx("input", { type: "number", min: "1", value: quantity, onChange: (e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0)), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Reason" }), _jsx("textarea", { value: reason, onChange: (e) => setReason(e.target.value), rows: 3, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", placeholder: "Enter reason for adjustment..." })] }), _jsxs("div", { className: "flex justify-end space-x-3 mt-6", children: [_jsx("button", { onClick: () => setIsModalOpen(false), className: "px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md", children: "Cancel" }), _jsx("button", { onClick: handleCreateAdjustment, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md", children: "Save" })] })] })] }) }))] }));
}

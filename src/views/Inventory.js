import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, clearAllInventory, updateProduct } from '../store/slices/inventorySlice';
import { setInventoryItemsPerPage } from '../store/slices/settingsSlice';
import UnifiedBarcodeScanner from '../components/UnifiedBarcodeScanner';
import { PlusIcon, MagnifyingGlassIcon, ArrowsRightLeftIcon, TrashIcon, ExclamationTriangleIcon, XMarkIcon, } from '@heroicons/react/24/outline';
import InventoryHistory from '../components/InventoryHistory';
import RemoveSerialsModal from '../components/RemoveSerialsModal';
import Orders from '../views/Orders';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getStockStatus } from '../utils/stockStatus';
const Inventory = () => {
    const dispatch = useDispatch();
    const { items: products, loading, error } = useSelector((state) => state.inventory);
    const settings = useSelector((state) => state.settings);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [filterText, setFilterText] = useState('');
    const [filterCategory, setFilterCategory] = useState('All Status');
    const [filterLocation, setFilterLocation] = useState('All Warehouses');
    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
    const [adjustmentType, setAdjustmentType] = useState('in');
    const [scanError, setScanError] = useState(null);
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [showRemoveSerials, setShowRemoveSerials] = useState(false);
    const [orderModalId, setOrderModalId] = useState(null);
    useEffect(() => {
        dispatch(fetchProducts());
        // Check if there's a product to adjust from the barcode scanner
        const adjustStockProductJson = localStorage.getItem('adjustStockProduct');
        if (adjustStockProductJson) {
            try {
                const product = JSON.parse(adjustStockProductJson);
                // Clear the localStorage item
                localStorage.removeItem('adjustStockProduct');
                // Set up the adjustment modal
                setSelectedProduct(product);
                setAdjustmentQuantity(0);
                setAdjustmentType('in');
                setAdjustmentReason('');
                setScanError(null);
                setIsAddStockModalOpen(true);
            }
            catch (error) {
                console.error('Error parsing product from localStorage:', error);
            }
        }
    }, [dispatch]);
    const handleAddStock = () => {
        setSelectedProduct(null);
        setAdjustmentQuantity(0);
        setAdjustmentType('in');
        setAdjustmentReason('');
        setScanError(null);
        setIsAddStockModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsAddStockModalOpen(false);
        setSelectedProduct(null);
        setAdjustmentQuantity(0);
        setAdjustmentType('in');
        setAdjustmentReason('');
        setScanError(null);
    };
    const handleStockAdjustment = async () => {
        if (!selectedProduct) {
            setScanError('Please select a product');
            return;
        }
        if (!adjustmentReason.trim()) {
            setScanError('Please provide a reason for the adjustment');
            return;
        }
        const newStock = adjustmentType === 'in'
            ? selectedProduct.stock + adjustmentQuantity
            : selectedProduct.stock - adjustmentQuantity;
        if (newStock < 0) {
            setScanError('Stock cannot be negative');
            return;
        }
        // Handle serialized products
        if (selectedProduct.is_serialized) {
            // For stock increase, redirect to Serial Number Manager
            if (newStock > selectedProduct.stock) {
                // Store the adjustment reason in localStorage
                localStorage.setItem('adjustmentReason', adjustmentReason.trim());
                setIsAddStockModalOpen(false);
                navigate(`/products?manageSerialsFor=${selectedProduct.id}`);
                return;
            }
            // For stock decrease, show RemoveSerialsModal
            if (newStock < selectedProduct.stock) {
                // Store the adjustment reason in localStorage
                localStorage.setItem('adjustmentReason', adjustmentReason.trim());
                setShowRemoveSerials(true);
                setIsAddStockModalOpen(false);
                return;
            }
        }
        // For non-serialized products or no stock change
        try {
            setIsAdjusting(true);
            await dispatch(updateProduct({
                id: selectedProduct.id,
                stock: newStock,
                adjustment_reason: adjustmentReason.trim()
            })).unwrap();
            handleCloseModal();
        }
        catch (error) {
            console.error('Failed to adjust stock:', error);
            setScanError(error instanceof Error ? error.message : 'Failed to adjust stock. Please try again.');
        }
        finally {
            setIsAdjusting(false);
        }
    };
    const handleSerialsRemoved = async () => {
        setShowRemoveSerials(false);
        if (selectedProduct) {
            setIsAdjusting(true);
            try {
                // Fetch the new count of available serials
                const { data: serials, error: serialsError } = await supabase
                    .from('serial_numbers')
                    .select('id')
                    .eq('product_id', selectedProduct.id)
                    .eq('status', 'available');
                if (serialsError)
                    throw serialsError;
                const newStock = serials ? serials.length : 0;
                await dispatch(updateProduct({
                    id: selectedProduct.id,
                    stock: newStock,
                    adjustment_reason: adjustmentReason.trim() || 'Stock adjusted after serial removal'
                })).unwrap();
                handleCloseModal();
            }
            catch (error) {
                setScanError(error instanceof Error ? error.message : 'Failed to adjust stock. Please try again.');
            }
            finally {
                setIsAdjusting(false);
            }
        }
    };
    const getStatusBadge = (stock, reorderLevel) => {
        const status = getStockStatus(stock, reorderLevel, settings.lowStockThreshold || 5);
        const styles = {
            'In Stock': 'bg-green-100 text-green-800',
            'Low Stock': 'bg-yellow-100 text-yellow-800',
            'Out of Stock': 'bg-red-100 text-red-800',
        };
        return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`, children: status }));
    };
    // Extract unique warehouses from products
    const warehouses = ['All Warehouses', ...new Set(products
            .filter(p => p.location && typeof p.location === 'string')
            .map(p => p.location.split(',')[0].trim())
            .filter(Boolean))];
    // Status options
    const statusOptions = ['All Status', 'In Stock', 'Low Stock', 'Out of Stock'];
    // Filter products
    const filteredProducts = products.filter(product => {
        // Filter out ghost/deleted products
        if (product.id.startsWith('GHOST-') ||
            product.name.startsWith('[DELETED]') ||
            product.sku.startsWith('DELETED-')) {
            return false;
        }
        const matchesWarehouse = filterLocation === '' || filterLocation === 'All Warehouses' ||
            (product.location && product.location.startsWith(filterLocation));
        const status = getStockStatus(product.stock, product.reorder_level || 0, settings.lowStockThreshold || 5);
        const matchesStatus = filterCategory === '' || filterCategory === 'All Status' || status === filterCategory;
        // Search filter
        const searchLower = filterText.toLowerCase();
        const matchesSearch = filterText === '' ||
            product.name.toLowerCase().includes(searchLower) ||
            product.sku.toLowerCase().includes(searchLower) ||
            (product.description && product.description.toLowerCase().includes(searchLower));
        return matchesWarehouse && matchesStatus && matchesSearch;
    });
    // Calculate pagination
    const itemsPerPage = settings.inventoryItemsPerPage || 10;
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const handleDeleteProduct = async (product) => {
        if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
            try {
                // TODO: Implement delete product functionality
                console.log('Deleting product:', product.id);
            }
            catch (error) {
                console.error('Failed to delete product:', error);
            }
        }
    };
    const handleClearAllInventory = async () => {
        if (window.confirm('Are you sure you want to clear all inventory? This action cannot be undone.')) {
            try {
                await dispatch(clearAllInventory()).unwrap();
                // Reset filters and current page
                setFilterText('');
                setFilterCategory('All Status');
                setFilterLocation('All Warehouses');
                setCurrentPage(1);
            }
            catch (error) {
                console.error('Failed to clear inventory:', error);
                alert('Failed to clear inventory. Please try again.');
            }
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "rounded-md bg-red-50 p-4", children: _jsx("div", { className: "flex", children: _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: "Error loading inventory" }), _jsx("div", { className: "mt-2 text-sm text-red-700", children: _jsx("p", { children: error }) })] }) }) }));
    }
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "sm:flex sm:items-center", children: [_jsxs("div", { className: "sm:flex-auto", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Inventory" }), _jsx("p", { className: "mt-2 text-sm text-gray-700", children: "A list of all products in your inventory including their location, stock levels, and value." })] }), _jsxs("div", { className: "mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex flex-wrap gap-2", children: [_jsx(UnifiedBarcodeScanner, { buttonText: "Scan Barcode", onComplete: () => dispatch(fetchProducts()) }), _jsxs("button", { type: "button", onClick: handleAddStock, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500", children: [_jsx(PlusIcon, { className: "-ml-1 mr-2 h-5 w-5", "aria-hidden": "true" }), "Add Stock"] }), _jsxs("button", { type: "button", onClick: handleClearAllInventory, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500", children: [_jsx(ExclamationTriangleIcon, { className: "-ml-1 mr-2 h-5 w-5", "aria-hidden": "true" }), "Clear All"] })] })] }), isAddStockModalOpen && (_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-lg font-medium", children: "Adjust Stock" }), _jsx("button", { onClick: handleCloseModal, className: "text-gray-400 hover:text-gray-500", children: _jsx(XMarkIcon, { className: "h-6 w-6" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Product" }), _jsxs("select", { value: selectedProduct?.id || '', onChange: (e) => {
                                                const product = products.find(p => p.id === e.target.value);
                                                setSelectedProduct(product || null);
                                            }, className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", children: [_jsx("option", { value: "", children: "Select a product" }), products
                                                    .filter(product => !product.id.startsWith('GHOST-') &&
                                                    !product.name.startsWith('[DELETED]') &&
                                                    !product.sku.startsWith('DELETED-'))
                                                    .map(product => (_jsxs("option", { value: product.id, children: [product.name, " (Current Stock: ", product.stock, ")"] }, product.id)))] })] }), !selectedProduct?.is_serialized && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Adjustment Type" }), _jsxs("select", { value: adjustmentType, onChange: (e) => setAdjustmentType(e.target.value), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", children: [_jsx("option", { value: "in", children: "Add Stock" }), _jsx("option", { value: "out", children: "Remove Stock" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Quantity" }), _jsx("input", { type: "number", min: "0", value: adjustmentQuantity, onChange: (e) => setAdjustmentQuantity(Math.max(0, parseInt(e.target.value) || 0)), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" })] })] })), selectedProduct?.is_serialized && (_jsxs("div", { className: "border border-blue-200 rounded-lg p-4 bg-blue-50", children: [_jsxs("div", { className: "mb-2 text-sm font-semibold text-blue-900 flex items-center gap-4", children: [_jsxs("span", { children: ["Current Stock: ", _jsx("b", { children: selectedProduct.stock })] }), _jsxs("span", { className: "text-xs text-blue-700", children: ["Available Serials: ", _jsx("b", { children: selectedProduct.stock })] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 mb-2", children: [_jsx("button", { type: "button", className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium shadow", onClick: () => {
                                                        setIsAddStockModalOpen(false);
                                                        navigate(`/products?manageSerialsFor=${selectedProduct.id}`);
                                                    }, children: "+ Add Serial Numbers" }), _jsx("button", { type: "button", className: "flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium shadow", onClick: () => {
                                                        setShowRemoveSerials(true);
                                                        setIsAddStockModalOpen(false);
                                                    }, children: "\u2013 Remove Serial Numbers" })] }), _jsxs("div", { className: "text-xs text-blue-700", children: [_jsx("b", { children: "Tip:" }), " You can paste, type, or scan multiple serials at once when adding. Use the checkboxes and search to quickly select serials for removal."] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Reason" }), _jsx("textarea", { value: adjustmentReason, onChange: (e) => setAdjustmentReason(e.target.value), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm", rows: 3, placeholder: "Enter reason for stock adjustment" })] }), scanError && (_jsx("div", { className: "rounded-md bg-red-50 p-3", children: _jsx("div", { className: "flex", children: _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: "Error" }), _jsx("div", { className: "mt-1 text-sm text-red-700", children: _jsx("p", { children: scanError }) })] }) }) })), _jsxs("div", { className: "flex justify-end space-x-3 mt-6", children: [_jsx("button", { onClick: handleCloseModal, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md", disabled: isAdjusting, children: "Cancel" }), _jsx("button", { onClick: handleStockAdjustment, className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50", disabled: isAdjusting, children: isAdjusting ? 'Saving...' : 'Save' })] })] })] }) })), showRemoveSerials && selectedProduct && (_jsx(RemoveSerialsModal, { productId: selectedProduct.id, onDone: handleSerialsRemoved, onClose: () => setShowRemoveSerials(false) })), orderModalId && (_jsx(Orders, { initialOrderId: orderModalId, onClose: () => setOrderModalId(null) })), _jsxs("div", { className: "mt-4 flex flex-wrap gap-4", children: [_jsx("div", { className: "flex-1 min-w-[200px]", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(MagnifyingGlassIcon, { className: "h-5 w-5 text-gray-400", "aria-hidden": "true" }) }), _jsx("input", { type: "text", value: filterText, onChange: (e) => {
                                        setFilterText(e.target.value);
                                        setCurrentPage(1);
                                    }, placeholder: "Search by name, SKU, or description...", className: "block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" })] }) }), _jsxs("div", { className: "flex gap-4", children: [_jsx("select", { value: filterLocation, onChange: (e) => {
                                    setFilterLocation(e.target.value);
                                    setCurrentPage(1);
                                }, className: "rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500", children: warehouses.map(warehouse => (_jsx("option", { value: warehouse, children: warehouse }, warehouse))) }), _jsx("select", { value: filterCategory, onChange: (e) => {
                                    setFilterCategory(e.target.value);
                                    setCurrentPage(1);
                                }, className: "rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500", children: statusOptions.map(option => (_jsx("option", { value: option, children: option }, option))) }), _jsxs("select", { value: itemsPerPage, onChange: (e) => {
                                    const newItemsPerPage = parseInt(e.target.value);
                                    dispatch(setInventoryItemsPerPage(newItemsPerPage));
                                    setCurrentPage(1);
                                }, className: "rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500", children: [_jsx("option", { value: "5", children: "5 per page" }), _jsx("option", { value: "10", children: "10 per page" }), _jsx("option", { value: "20", children: "20 per page" }), _jsx("option", { value: "50", children: "50 per page" })] })] })] }), _jsx("div", { className: "mt-6 overflow-hidden border border-gray-200 rounded-lg", children: _jsx("div", { className: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { scope: "col", className: "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6", children: "PRODUCT" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "SKU" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "LOCATION" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "CURRENT STOCK" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "REORDER LEVEL" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "STATUS" }), _jsx("th", { scope: "col", className: "relative py-3.5 pl-3 pr-4 sm:pr-6", children: _jsx("span", { className: "sr-only", children: "Actions" }) })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200 bg-white", children: paginatedProducts.map((product) => (_jsxs("tr", { children: [_jsx("td", { className: "whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "h-10 w-10 flex-shrink-0", children: _jsx("div", { className: "h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center", children: _jsx("span", { className: "text-gray-500 font-medium", children: product.name.charAt(0) }) }) }), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: "font-medium text-gray-900", children: product.name }), _jsx("div", { className: "text-gray-500", children: product.description })] })] }) }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: product.sku }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: product.location }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: product.stock }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: product.reorder_level }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: getStatusBadge(product.stock, product.reorder_level) }), _jsx("td", { className: "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6", children: _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { onClick: () => {
                                                            setSelectedProduct(product);
                                                            setIsAddStockModalOpen(true);
                                                            setAdjustmentQuantity(0);
                                                            setAdjustmentType('in');
                                                            setAdjustmentReason('');
                                                        }, className: "text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md p-2 transition-colors", title: "Adjust Stock", children: _jsx(ArrowsRightLeftIcon, { className: "h-5 w-5" }) }), _jsx("button", { onClick: () => handleDeleteProduct(product), className: "text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 rounded-md p-2 transition-colors", title: "Delete Product", children: _jsx(TrashIcon, { className: "h-5 w-5" }) })] }) })] }, product.id))) })] }) }) }), _jsx("div", { className: "mt-6", children: _jsx(InventoryHistory, {}) }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsx("div", { className: "flex items-center gap-4", children: _jsxs("div", { className: "flex-1 text-sm text-gray-700", children: ["Showing ", _jsx("span", { className: "font-medium", children: ((currentPage - 1) * itemsPerPage) + 1 }), " to", ' ', _jsx("span", { className: "font-medium", children: Math.min(currentPage * itemsPerPage, filteredProducts.length) }), ' ', "of ", _jsx("span", { className: "font-medium", children: filteredProducts.length }), " items"] }) }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => setCurrentPage(prev => Math.max(1, prev - 1)), disabled: currentPage === 1, className: "px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50", children: "<" }), Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (_jsx("button", { onClick: () => setCurrentPage(pageNum), className: `px-3 py-1 border rounded-md ${currentPage === pageNum
                                        ? 'bg-blue-600 text-white'
                                        : 'hover:bg-gray-50'}`, children: pageNum }, pageNum));
                            }), _jsx("button", { onClick: () => setCurrentPage(prev => Math.min(totalPages, prev + 1)), disabled: currentPage === totalPages, className: "px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50", children: ">" })] })] })] }));
};
export default Inventory;

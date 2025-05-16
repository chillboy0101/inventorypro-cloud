import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, deleteProduct, fetchCategories, fetchLocations, clearAllInventory, updateProduct } from '../store/slices/inventorySlice';
import { setItemsPerPage } from '../store/slices/settingsSlice';
import { useAppSettings } from '../hooks/useAppSettings';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, ExclamationTriangleIcon, ShoppingBagIcon, QrCodeIcon, } from '@heroicons/react/24/outline';
import AddProductForm from '../components/AddProductForm';
import EditProductForm from '../components/EditProductForm';
import UnifiedBarcodeScanner from '../components/UnifiedBarcodeScanner';
import SerialNumberManager from '../components/SerialNumberManager';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getStockStatus } from '../utils/stockStatus';
const Products = () => {
    const dispatch = useDispatch();
    const { items: products, loading, categories, locations, error } = useSelector((state) => state.inventory);
    const settings = useSelector((state) => state.settings);
    const { formatPrice, isLowStock, companyName } = useAppSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [deletingProductId, setDeletingProductId] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [initialSku, setInitialSku] = useState('');
    const [initialProductData, setInitialProductData] = useState({});
    const [selectedProductForSerial, setSelectedProductForSerial] = useState(null);
    const [pendingSerialProduct, setPendingSerialProduct] = useState(null);
    useEffect(() => {
        dispatch(fetchProducts());
        dispatch(fetchCategories());
        dispatch(fetchLocations());
    }, [dispatch]);
    // Check for pending barcode from scanner
    useEffect(() => {
        const pendingBarcodeSku = localStorage.getItem('pendingBarcodeSku');
        if (pendingBarcodeSku) {
            // Clear it immediately to prevent re-opening on page refresh
            localStorage.removeItem('pendingBarcodeSku');
            // Check for additional product data
            const pendingProductDataStr = localStorage.getItem('pendingProductData');
            localStorage.removeItem('pendingProductData');
            let productData = {};
            if (pendingProductDataStr) {
                try {
                    productData = JSON.parse(pendingProductDataStr);
                }
                catch (e) {
                    console.error('Error parsing pending product data:', e);
                }
            }
            // Set the initial data and open the add form
            setInitialSku(pendingBarcodeSku);
            setInitialProductData(productData);
            setShowAddForm(true);
        }
    }, []);
    // Reset to first page when filters or page size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, categoryFilter, locationFilter, settings.itemsPerPage]);
    // Filter products based on search query, category, and location
    const filteredProducts = products
        .filter(product => {
        // Filter out ghost/deleted products
        if (product.id.startsWith('GHOST-') ||
            product.name.startsWith('[DELETED]') ||
            product.sku.startsWith('DELETED-')) {
            return false;
        }
        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesName = product.name.toLowerCase().includes(query);
            const matchesSku = product.sku.toLowerCase().includes(query);
            const matchesDescription = product.description?.toLowerCase().includes(query);
            if (!matchesName && !matchesSku && !matchesDescription)
                return false;
        }
        // Apply category filter
        if (categoryFilter !== 'all' && product.category !== categoryFilter)
            return false;
        // Apply location filter
        if (locationFilter !== 'all' && product.location !== locationFilter)
            return false;
        return true;
    })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * settings.itemsPerPage, currentPage * settings.itemsPerPage);
    const totalPages = Math.ceil(filteredProducts.length / settings.itemsPerPage);
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }
        try {
            setDeletingProductId(id);
            setDeleteError(null);
            // Delete the product using the Redux action
            await dispatch(deleteProduct(id)).unwrap();
            // Check if we need to update the current page
            const remainingProducts = products.filter(p => p.id !== id);
            const totalPages = Math.ceil(remainingProducts.length / settings.itemsPerPage);
            if (currentPage > totalPages) {
                setCurrentPage(totalPages || 1);
            }
            else if (remainingProducts.length % settings.itemsPerPage === 0 &&
                currentPage === totalPages &&
                currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        }
        catch (error) {
            console.error('Failed to delete product:', error);
            setDeleteError('Failed to delete product. Please try again.');
        }
        finally {
            setDeletingProductId(null);
        }
    };
    const handleClearAllProducts = async () => {
        if (!window.confirm('Are you sure you want to clear ALL products? This action cannot be undone and will also remove all related stock adjustments and order items.')) {
            return;
        }
        try {
            await dispatch(clearAllInventory()).unwrap();
            setCurrentPage(1);
            setSearchQuery('');
            setCategoryFilter('all');
            setLocationFilter('all');
        }
        catch (error) {
            console.error('Failed to clear products:', error);
            setDeleteError('Failed to clear all products. Please try again.');
        }
    };
    const handleItemsPerPageChange = (value) => {
        dispatch(setItemsPerPage(value));
        setCurrentPage(1); // Reset to first page when changing items per page
    };
    // Custom handler for product creation
    const handleProductCreated = (product) => {
        setShowAddForm(false);
        if (product.is_serialized && product.stock > 0) {
            setPendingSerialProduct(product);
        }
    };
    // Handler to open order page from SerialNumberManager and close serial modal
    const handleOrderLinkFromSerials = (orderId) => {
        setSelectedProductForSerial(null); // Close SerialNumberManager
        setTimeout(() => {
            navigate(`/orders?orderId=${orderId}`);
        }, 200);
    };
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const manageSerialsFor = params.get('manageSerialsFor');
        if (manageSerialsFor && products.length > 0) {
            const product = products.find(p => p.id === manageSerialsFor);
            if (product)
                setSelectedProductForSerial(product);
        }
    }, [location.search, products]);
    // Handler after serials are added: update stock to match serial count if needed
    const handleSerialsDone = async () => {
        if (selectedProductForSerial) {
            try {
                // Fetch serials for this product
                const { data: serials, error: serialsError } = await supabase
                    .from('serial_numbers')
                    .select('*')
                    .eq('product_id', selectedProductForSerial.id)
                    .eq('status', 'available');
                if (serialsError)
                    throw serialsError;
                if (serials) {
                    const serialCount = serials.length;
                    if (serialCount !== selectedProductForSerial.stock) {
                        await dispatch(updateProduct({
                            id: selectedProductForSerial.id,
                            stock: serialCount,
                            adjustment_reason: `Stock synced to serials (${serialCount})`
                        })).unwrap();
                    }
                }
            }
            catch (error) {
                console.error('Failed to update stock after adding serials:', error);
            }
        }
        setSelectedProductForSerial(null);
        // Remove the query param from the URL
        const params = new URLSearchParams(location.search);
        params.delete('manageSerialsFor');
        navigate({ search: params.toString() }, { replace: true });
    };
    if (loading) {
        return _jsx("div", { className: "flex justify-center items-center h-64", children: "Loading..." });
    }
    if (error) {
        return _jsxs("div", { className: "text-red-600", children: ["Error: ", error] });
    }
    return (_jsx("div", { className: `${settings.darkMode ? 'bg-[#121212] text-white' : 'bg-white'}`, children: _jsxs("div", { className: `px-4 sm:px-6 lg:px-8 py-6 ${settings.darkMode ? 'text-white' : 'text-gray-900'}`, children: [_jsxs("div", { className: "sm:flex sm:items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: `text-2xl font-bold tracking-tight ${settings.darkMode ? 'text-white' : 'text-gray-900'} mb-1`, children: [companyName, " Products"] }), _jsx("p", { className: `text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-700'}`, children: "A list of all products in your inventory" })] }), _jsxs("div", { className: "mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex flex-wrap gap-2", children: [_jsxs("button", { onClick: () => setShowAddForm(true), className: "inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto transition-colors", children: [_jsx(PlusIcon, { className: "h-4 w-4 mr-2" }), "Add Product"] }), _jsx(UnifiedBarcodeScanner, { buttonText: "Scan Barcode", onComplete: () => dispatch(fetchProducts()) }), _jsxs("button", { onClick: handleClearAllProducts, className: "inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto transition-colors", children: [_jsx(ExclamationTriangleIcon, { className: "h-4 w-4 mr-2" }), "Clear All"] })] })] }), _jsxs("div", { className: "mt-6 grid grid-cols-1 gap-4 sm:grid-cols-5", children: [_jsxs("div", { className: "relative rounded-md shadow", children: [_jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(MagnifyingGlassIcon, { className: `h-5 w-5 ${settings.darkMode ? 'text-gray-400' : 'text-gray-400'}` }) }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: `block w-full rounded-md pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${settings.darkMode
                                        ? 'bg-[#2d2d2d] border-[#3d3d3d] text-white placeholder-gray-500'
                                        : 'border-gray-300 text-gray-900'}`, placeholder: "Search products..." })] }), _jsxs("select", { value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value), className: `block w-full rounded-md focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${settings.darkMode
                                ? 'bg-[#2d2d2d] border-[#3d3d3d] text-white'
                                : 'border-gray-300 text-gray-900'}`, children: [_jsx("option", { value: "all", children: "All Categories" }), categories.map(category => (_jsx("option", { value: category, children: category }, category)))] }), _jsxs("select", { value: locationFilter, onChange: (e) => setLocationFilter(e.target.value), className: `block w-full rounded-md focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${settings.darkMode
                                ? 'bg-[#2d2d2d] border-[#3d3d3d] text-white'
                                : 'border-gray-300 text-gray-900'}`, children: [_jsx("option", { value: "all", children: "All Locations" }), locations.map(location => (_jsx("option", { value: location, children: location }, location)))] }), _jsxs("select", { value: settings.itemsPerPage, onChange: (e) => handleItemsPerPageChange(Number(e.target.value)), className: `block w-full rounded-md focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${settings.darkMode
                                ? 'bg-[#2d2d2d] border-[#3d3d3d] text-white'
                                : 'border-gray-300 text-gray-900'}`, children: [_jsx("option", { value: 5, children: "5 per page" }), _jsx("option", { value: 10, children: "10 per page" }), _jsx("option", { value: 20, children: "20 per page" }), _jsx("option", { value: 50, children: "50 per page" })] })] }), deleteError && (_jsx("div", { className: "mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md", children: deleteError })), _jsx("div", { className: `mt-8 flex flex-col ${settings.darkMode ? 'bg-[#1e1e1e]' : 'bg-white'} shadow-xl overflow-hidden sm:rounded-lg border ${settings.darkMode ? 'border-[#3d3d3d]' : 'border-gray-200'}`, children: _jsx("div", { className: "overflow-x-auto", children: _jsx("div", { className: "inline-block min-w-full align-middle", children: _jsxs("table", { className: `min-w-full divide-y ${settings.darkMode ? 'divide-[#3d3d3d]' : 'divide-gray-200'}`, children: [_jsx("thead", { className: `${settings.darkMode ? 'bg-[#272727]' : 'bg-gray-50'}`, children: _jsxs("tr", { children: [_jsx("th", { scope: "col", className: `py-3.5 pl-4 pr-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`, children: "Product" }), _jsx("th", { scope: "col", className: `py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`, children: "SKU" }), _jsx("th", { scope: "col", className: `py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`, children: "Category" }), _jsx("th", { scope: "col", className: `py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`, children: "Location" }), _jsx("th", { scope: "col", className: `py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`, children: "Stock" }), _jsx("th", { scope: "col", className: `py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`, children: "Price" }), _jsx("th", { scope: "col", className: `py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`, children: "Value" }), _jsx("th", { scope: "col", className: `py-3.5 px-3 text-left text-sm font-semibold ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'} uppercase tracking-wider`, children: "Serialized?" }), _jsx("th", { scope: "col", className: `relative py-3.5 pl-3 pr-4 ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'}`, children: _jsx("span", { className: "sr-only", children: "Actions" }) })] }) }), _jsx("tbody", { className: `divide-y ${settings.darkMode ? 'divide-[#3d3d3d]' : 'divide-gray-200'}`, children: paginatedProducts.map((product) => (_jsxs("tr", { className: `${settings.darkMode ? 'hover:bg-[#2a2a2a] transition-colors' : 'hover:bg-gray-50'}`, children: [_jsx("td", { className: `whitespace-nowrap py-4 pl-4 pr-3 text-sm ${settings.darkMode ? 'text-gray-200' : 'text-gray-900'}`, children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `h-10 w-10 flex-shrink-0 rounded-md ${settings.darkMode ? 'bg-blue-900/20' : 'bg-blue-100'} flex items-center justify-center`, children: _jsx(ShoppingBagIcon, { className: `h-6 w-6 ${settings.darkMode ? 'text-blue-400' : 'text-blue-600'}` }) }), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: `font-medium ${settings.darkMode ? 'text-white' : 'text-gray-900'}`, children: product.name }), _jsx("div", { className: `text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`, children: product.description })] })] }) }), _jsx("td", { className: `whitespace-nowrap py-4 px-3 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`, children: product.sku }), _jsx("td", { className: `whitespace-nowrap py-4 px-3 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`, children: product.category }), _jsx("td", { className: `whitespace-nowrap py-4 px-3 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`, children: product.location }), _jsx("td", { className: "whitespace-nowrap py-4 px-3 text-sm", children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium leading-5 ${getStockStatus(product.stock, product.reorder_level || 0, settings.lowStockThreshold || 5) === 'Out of Stock'
                                                                    ? settings.darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
                                                                    : getStockStatus(product.stock, product.reorder_level || 0, settings.lowStockThreshold || 5) === 'Low Stock'
                                                                        ? settings.darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800'
                                                                        : settings.darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'} mr-2`, children: getStockStatus(product.stock, product.reorder_level || 0, settings.lowStockThreshold || 5) }), _jsx("span", { className: `${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`, children: product.stock })] }) }), _jsx("td", { className: `whitespace-nowrap py-4 px-3 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`, children: formatPrice(product.selling_price ?? 0) }), _jsx("td", { className: `whitespace-nowrap py-4 px-3 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`, children: formatPrice(product.stock * (product.selling_price ?? 0)) }), _jsx("td", { className: `whitespace-nowrap py-4 px-3 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-500'}`, children: String(product.is_serialized) }), _jsx("td", { className: "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium", children: _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsxs("button", { onClick: () => setEditingProduct(product), className: `inline-flex items-center p-1.5 rounded-md transition-colors ${settings.darkMode
                                                                    ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30'
                                                                    : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'}`, disabled: deletingProductId === product.id, title: "Edit product", children: [_jsx(PencilIcon, { className: "h-5 w-5" }), _jsx("span", { className: "sr-only", children: "Edit" })] }), _jsxs("button", { onClick: () => handleDelete(product.id), className: `inline-flex items-center p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${settings.darkMode
                                                                    ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                                                                    : 'text-red-600 hover:text-red-900 hover:bg-red-50'}`, disabled: deletingProductId === product.id, title: "Delete product", children: [deletingProductId === product.id ? (_jsx("div", { className: "h-5 w-5 animate-spin rounded-full border-b-2 border-red-600" })) : (_jsx(TrashIcon, { className: "h-5 w-5" })), _jsx("span", { className: "sr-only", children: "Delete" })] }), product.is_serialized && (_jsx("button", { onClick: () => setSelectedProductForSerial(product), className: "text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md p-2 transition-colors", title: "View Serials", children: _jsx(QrCodeIcon, { className: "h-5 w-5" }) }))] }) })] }, product.id))) })] }) }) }) }), _jsxs("div", { className: "mt-6 flex items-center justify-between", children: [_jsxs("div", { className: `flex-1 text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-700'}`, children: ["Showing ", _jsx("span", { className: "font-medium", children: ((currentPage - 1) * settings.itemsPerPage) + 1 }), " to", ' ', _jsx("span", { className: "font-medium", children: Math.min(currentPage * settings.itemsPerPage, filteredProducts.length) }), ' ', "of ", _jsx("span", { className: "font-medium", children: filteredProducts.length }), " products"] }), _jsxs("div", { className: "flex space-x-1", children: [_jsx("button", { onClick: () => setCurrentPage(prev => Math.max(1, prev - 1)), disabled: currentPage === 1, className: `relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${settings.darkMode
                                        ? 'bg-[#2d2d2d] text-gray-300 border-[#3d3d3d] hover:bg-[#3d3d3d] disabled:opacity-50 disabled:hover:bg-[#2d2d2d]'
                                        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50'} border transition-colors`, children: _jsx(ChevronLeftIcon, { className: "h-5 w-5", "aria-hidden": "true" }) }), [...Array(totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    const isCurrentPage = page === currentPage;
                                    const isNearCurrentPage = Math.abs(page - currentPage) <= 1;
                                    const isFirstPage = page === 1;
                                    const isLastPage = page === totalPages;
                                    if (isCurrentPage || isNearCurrentPage || isFirstPage || isLastPage) {
                                        return (_jsxs(React.Fragment, { children: [!isNearCurrentPage && !isFirstPage && page === currentPage - 2 && (_jsx("span", { className: `relative inline-flex items-center px-4 py-2 text-sm font-medium ${settings.darkMode
                                                        ? 'bg-[#2d2d2d] text-gray-400 border-[#3d3d3d]'
                                                        : 'bg-white text-gray-700 border-gray-300'} border`, children: "..." })), _jsx("button", { onClick: () => setCurrentPage(page), className: `relative inline-flex items-center px-4 py-2 text-sm font-medium border transition-colors ${isCurrentPage
                                                        ? settings.darkMode
                                                            ? 'z-10 bg-blue-600 text-white border-blue-600'
                                                            : 'z-10 bg-blue-600 text-white border-blue-600'
                                                        : settings.darkMode
                                                            ? 'bg-[#2d2d2d] text-gray-300 border-[#3d3d3d] hover:bg-[#3d3d3d]'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`, children: page }), !isNearCurrentPage && !isLastPage && page === currentPage + 2 && (_jsx("span", { className: `relative inline-flex items-center px-4 py-2 text-sm font-medium ${settings.darkMode
                                                        ? 'bg-[#2d2d2d] text-gray-400 border-[#3d3d3d]'
                                                        : 'bg-white text-gray-700 border-gray-300'} border`, children: "..." }))] }, page));
                                    }
                                    return null;
                                }), _jsx("button", { onClick: () => setCurrentPage(prev => Math.min(totalPages, prev + 1)), disabled: currentPage === totalPages, className: `relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${settings.darkMode
                                        ? 'bg-[#2d2d2d] text-gray-300 border-[#3d3d3d] hover:bg-[#3d3d3d] disabled:opacity-50 disabled:hover:bg-[#2d2d2d]'
                                        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50'} border transition-colors`, children: _jsx(ChevronRightIcon, { className: "h-5 w-5", "aria-hidden": "true" }) })] })] }), showAddForm && (_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center", children: _jsx("div", { className: `bg-white rounded-lg p-6 max-w-2xl w-full ${settings.darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`, children: _jsx(AddProductForm, { onClose: () => setShowAddForm(false), initialSku: initialSku, initialProductData: initialProductData, onProductCreated: handleProductCreated }) }) })), editingProduct && (_jsx(EditProductForm, { product: editingProduct, onClose: () => setEditingProduct(null), onSuccess: () => { } })), selectedProductForSerial && (_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4", children: _jsx(SerialNumberManager, { productId: selectedProductForSerial.id, onClose: handleSerialsDone, onOrderLinkClick: handleOrderLinkFromSerials }) })), pendingSerialProduct && (_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4", children: _jsx(SerialNumberManager, { productId: pendingSerialProduct.id, initialCount: pendingSerialProduct.stock, onClose: () => setPendingSerialProduct(null) }) }))] }) }));
};
export default Products;

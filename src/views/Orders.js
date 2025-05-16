import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders, updateOrderStatus, setLoading, deleteOrder, clearAllOrders, } from '../store/slices/ordersSlice';
import { setOrderItemsPerPage } from '../store/slices/settingsSlice';
import { useAppSettings } from '../hooks/useAppSettings';
import { formatCurrency } from '../utils/formatters';
import { PlusIcon, ArrowPathIcon, TrashIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, EyeIcon, PrinterIcon, CheckCircleIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon, } from '@heroicons/react/24/outline';
import { ordersApi } from '../lib/api';
import { format } from 'date-fns';
import AddOrderForm from '../components/AddOrderForm';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';
function hasItems(order) {
    return ('items' in order &&
        Array.isArray(order.items) &&
        order.items.length > 0 &&
        order.items.every(item => 'product_id' in item));
}
// Define status options for dropdowns
const statusOptions = ['All Status', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const dateOptions = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'];
export default function Orders({ initialOrderId, onClose } = {}) {
    const dispatch = useDispatch();
    const ordersState = useSelector((state) => state.orders);
    const settings = useSelector((state) => state.settings);
    const { formatPrice } = useAppSettings();
    const location = useLocation();
    const [statusFilter, setStatusFilter] = useState(statusOptions[0]);
    const [dateFilter, setDateFilter] = useState(dateOptions[1]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(settings.orderItemsPerPage || 5);
    const [showAddForm, setShowAddForm] = useState(false);
    const [viewOrderModal, setViewOrderModal] = useState(false);
    const [selectedOrderState, setSelectedOrderState] = useState(null);
    const [serialsByOrderItem, setSerialsByOrderItem] = useState({});
    const orders = ordersState.items;
    const ordersLoading = ordersState.loading;
    const ordersError = ordersState.error;
    useEffect(() => {
        console.log('Initial load - fetching orders and products');
        dispatch(fetchOrders());
    }, [dispatch]);
    useEffect(() => {
        if (viewOrderModal && selectedOrderState) {
            (async () => {
                const serialsMap = {};
                for (const item of selectedOrderState.items) {
                    // Only fetch for serialized products
                    if (item.product?.is_serialized) {
                        const { data } = await supabase
                            .from('serial_numbers')
                            .select('serial_number')
                            .eq('product_id', item.product_id)
                            .eq('order_id', selectedOrderState.id)
                            .eq('status', 'sold');
                        serialsMap[item.product_id] = (data || []).map(s => s.serial_number);
                    }
                }
                setSerialsByOrderItem(serialsMap);
            })();
        }
    }, [viewOrderModal, selectedOrderState]);
    useEffect(() => {
        // Check for orderId in URL query params
        const params = new URLSearchParams(location.search);
        const urlOrderId = params.get('orderId');
        if (urlOrderId) {
            const order = orders.find(o => o.id === urlOrderId);
            if (order) {
                setSelectedOrderState(order);
                setViewOrderModal(true);
            }
        }
    }, [location.search, orders]);
    // Filter orders based on status, date, and search query
    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === statusOptions[0] || order.status.toLowerCase() === statusFilter.toLowerCase();
        const cutoffDate = getDateFromFilter(dateFilter);
        const orderDate = new Date(order.created_at);
        const matchesDate = orderDate >= cutoffDate;
        const matchesSearch = order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesDate && matchesSearch;
    });
    // Calculate pagination
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    function getDateFromFilter(filter) {
        const now = new Date();
        switch (filter) {
            case 'Last 7 Days':
                return new Date(now.setDate(now.getDate() - 7));
            case 'Last 90 Days':
                return new Date(now.setDate(now.getDate() - 90));
            default: // Last 30 Days
                return new Date(now.setDate(now.getDate() - 30));
        }
    }
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === now.toDateString()) {
            return `Today, ${format(date, 'hh:mm a')}`;
        }
        else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${format(date, 'hh:mm a')}`;
        }
        else {
            return format(date, 'MMM dd, yyyy');
        }
    }
    // This function is left as reference but not currently used
    // It could be used for manual refresh if needed
    /*
    async function loadOrders() {
      try {
        dispatch(setLoading(true));
        const data = await ordersApi.getWithItems();
        dispatch(setOrders(data));
        dispatch(setError(null));
      } catch (err) {
        dispatch(setError(err instanceof Error ? err.message : 'Failed to load orders'));
      } finally {
        dispatch(setLoading(false));
      }
    }
    */
    function getStatusBadge(status) {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-orange-100 text-orange-800',
            shipped: 'bg-green-100 text-green-800',
            delivered: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`, children: status.charAt(0).toUpperCase() + status.slice(1) }));
    }
    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            return;
        }
        try {
            dispatch(setLoading(true));
            await dispatch(deleteOrder(orderId)).unwrap();
        }
        catch (error) {
            console.error('Error deleting order:', error);
            alert('Failed to delete order. Please try again.');
        }
        finally {
            dispatch(setLoading(false));
        }
    };
    const handleStatusUpdate = async (id, status) => {
        try {
            await dispatch(updateOrderStatus({ id, status })).unwrap();
        }
        catch (error) {
            console.error('Failed to update order status:', error);
            alert('Failed to update order status. Please try again.');
        }
    };
    const handleViewOrder = (order) => {
        if (!order)
            return;
        // If the order already has items, use them directly
        if (hasItems(order)) {
            setSelectedOrderState(order);
            setViewOrderModal(true);
            return;
        }
        // Otherwise, fetch the complete order with items
        ordersApi.getWithItems()
            .then(orders => {
            const completeOrder = orders.find(o => o.id === order.id);
            if (completeOrder) {
                setSelectedOrderState({
                    ...completeOrder,
                    items: completeOrder.order_items || []
                });
                setViewOrderModal(true);
            }
        })
            .catch(error => {
            console.error('Error fetching order details:', error);
            alert('Failed to load order details. Please try again.');
        });
    };
    const handlePrintOrder = async (order) => {
        try {
            // Fetch the complete order with items if not already loaded
            let orderWithItems;
            if (hasItems(order)) {
                orderWithItems = order;
            }
            else {
                const orders = await ordersApi.getWithItems();
                const completeOrder = orders.find(o => o.id === order.id);
                if (!completeOrder) {
                    throw new Error('Order not found');
                }
                orderWithItems = completeOrder;
            }
            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('Please allow popups to print the order.');
                return;
            }
            // Create the print content with improved styling
            const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Order ${orderWithItems.id}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              
              body {
                font-family: 'Inter', sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 40px;
                color: #1f2937;
                background-color: #ffffff;
              }
              
              .container {
                max-width: 800px;
                margin: 0 auto;
              }
              
              .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e5e7eb;
              }
              
              .header h1 {
                font-size: 28px;
                color: #1f2937;
                margin: 0 0 10px 0;
              }
              
              .header p {
                color: #6b7280;
                font-size: 16px;
                margin: 0;
              }
              
              .company-info {
                text-align: center;
                margin-bottom: 30px;
              }
              
              .company-info h2 {
                font-size: 24px;
                color: #4f46e5;
                margin: 0 0 5px 0;
              }
              
              .order-info {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 30px;
                margin-bottom: 40px;
                padding: 20px;
                background-color: #f9fafb;
                border-radius: 8px;
              }
              
              .order-info-item {
                margin-bottom: 15px;
              }
              
              .order-info-item .label {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 4px;
              }
              
              .order-info-item .value {
                font-size: 16px;
                color: #1f2937;
                font-weight: 500;
              }
              
              .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 9999px;
                font-size: 14px;
                font-weight: 500;
              }
              
              .status-badge.completed {
                background-color: #dcfce7;
                color: #15803d;
              }
              
              .status-badge.pending {
                background-color: #fef9c3;
                color: #854d0e;
              }
              
              .status-badge.cancelled {
                background-color: #fee2e2;
                color: #b91c1c;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 30px 0;
                font-size: 14px;
              }
              
              th {
                background-color: #f3f4f6;
                padding: 12px 16px;
                text-align: left;
                font-weight: 600;
                color: #4b5563;
                text-transform: uppercase;
                font-size: 12px;
                letter-spacing: 0.05em;
              }
              
              td {
                padding: 16px;
                border-bottom: 1px solid #e5e7eb;
              }
              
              .product-name {
                font-weight: 500;
                color: #1f2937;
              }
              
              .product-sku {
                color: #6b7280;
                font-size: 13px;
              }
              
              .total-section {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
              }
              
              .total-row {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                margin-bottom: 10px;
                font-size: 16px;
              }
              
              .total-label {
                color: #6b7280;
                margin-right: 20px;
              }
              
              .total-value {
                font-weight: 600;
                color: #1f2937;
                min-width: 120px;
                text-align: right;
              }
              
              .grand-total {
                font-size: 20px;
                font-weight: 700;
                color: #4f46e5;
              }
              
              .footer {
                margin-top: 60px;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
              
              @media print {
                body {
                  padding: 20px;
                }
                
                .no-print {
                  display: none;
                }
                
                @page {
                  margin: 20mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="company-info">
                  <h2>InventoryPro Cloud</h2>
                  <p>Order Details</p>
                </div>
              </div>

              <div class="order-info">
                <div class="order-info-item">
                  <div class="label">Order ID</div>
                  <div class="value">${orderWithItems.id}</div>
                </div>
                <div class="order-info-item">
                  <div class="label">Date & Time</div>
                  <div class="value">${formatDate(orderWithItems.created_at)}</div>
                </div>
                <div class="order-info-item">
                  <div class="label">Customer</div>
                  <div class="value">${orderWithItems.customer}</div>
                </div>
                <div class="order-info-item">
                  <div class="label">Status</div>
                  <div class="value">
                    <span class="status-badge ${orderWithItems.status}">
                      ${orderWithItems.status.charAt(0).toUpperCase() + orderWithItems.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th style="text-align: right;">Quantity</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderWithItems.items.map(item => {
                const product = item.product;
                const isProductDeleted = !product || Object.keys(product).length === 0 || item.product_id === null;
                const productName = isProductDeleted
                    ? (item.product_name || "Product Deleted")
                    : product.name;
                const productSku = isProductDeleted
                    ? (item.product_sku || "Unknown SKU")
                    : product.sku;
                return `
                    <tr>
                      <td>
                        <div class="product-name">${productName}</div>
                        <div class="product-sku">${productSku}${isProductDeleted ? ' - Product no longer in inventory' : ''}</div>
                      </td>
                      <td style="text-align: right;">${item.quantity}</td>
                      <td style="text-align: right;">${formatCurrency(item.price, settings.currency || 'USD')}</td>
                      <td style="text-align: right;">${formatCurrency((item.quantity * item.price), settings.currency || 'USD')}</td>
                    </tr>
                  `;
            }).join('')}
                </tbody>
              </table>

              <div class="total-section">
                <div class="total-row">
                  <div class="total-label">Total Items:</div>
                  <div class="total-value">${orderWithItems.total_items}</div>
                </div>
                <div class="total-row">
                  <div class="total-label">Total Amount:</div>
                  <div class="total-value grand-total">${formatCurrency(orderWithItems.total_amount, settings.currency || 'USD')}</div>
                </div>
              </div>

              <div class="footer">
                <p>Generated on ${new Date().toLocaleString()}</p>
                <p>Thank you for your business!</p>
              </div>

              <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()" style="
                  background-color: #4f46e5;
                  color: white;
                  padding: 8px 16px;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  margin-right: 10px;
                ">Print Order</button>
                <button onclick="window.close()" style="
                  background-color: #9ca3af;
                  color: white;
                  padding: 8px 16px;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                ">Close</button>
              </div>
            </div>
          </body>
        </html>
      `;
            // Write the content to the new window
            printWindow.document.write(printContent);
            printWindow.document.close();
            // Wait for images and styles to load before printing
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                }, 250);
            };
        }
        catch (error) {
            console.error('Error printing order:', error);
            alert('Failed to print order. Please try again.');
        }
    };
    const handleClearAllOrders = async () => {
        if (!window.confirm('Are you sure you want to clear ALL orders? This action cannot be undone.')) {
            return;
        }
        try {
            dispatch(setLoading(true));
            await dispatch(clearAllOrders()).unwrap();
            // Reset filters and pagination
            setCurrentPage(1);
            setSearchQuery('');
            setStatusFilter(statusOptions[0]);
            setDateFilter(dateOptions[1]);
        }
        catch (error) {
            console.error('Error clearing all orders:', error);
            alert('Failed to clear all orders. Please try again.');
        }
        finally {
            dispatch(setLoading(false));
        }
    };
    const renderOrderActions = (order) => {
        const renderStatusButton = () => {
            switch (order.status) {
                case 'pending':
                    return (_jsx("button", { onClick: () => handleStatusUpdate(order.id, 'processing'), className: "text-orange-600 hover:text-orange-900", title: "Mark as Processing", children: _jsx(ArrowPathIcon, { className: "h-5 w-5" }) }));
                case 'processing':
                    return (_jsx("button", { onClick: () => handleStatusUpdate(order.id, 'shipped'), className: "text-blue-600 hover:text-blue-900", title: "Mark as Shipped", children: _jsx(ArrowPathIcon, { className: "h-5 w-5" }) }));
                case 'shipped':
                    return (_jsx("button", { onClick: () => handleStatusUpdate(order.id, 'delivered'), className: "text-green-600 hover:text-green-900", title: "Mark as Delivered", children: _jsx(CheckCircleIcon, { className: "h-5 w-5" }) }));
                default:
                    return null;
            }
        };
        return (_jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { onClick: () => handleViewOrder(order), className: "text-blue-600 hover:text-blue-900", title: "View Order", children: _jsx(EyeIcon, { className: "h-5 w-5" }) }), _jsx("button", { onClick: () => handlePrintOrder(order), className: "text-gray-600 hover:text-gray-900", title: "Print Order", children: _jsx(PrinterIcon, { className: "h-5 w-5" }) }), renderStatusButton(), order.status !== 'delivered' && order.status !== 'cancelled' && (_jsx("button", { onClick: () => handleStatusUpdate(order.id, 'cancelled'), className: "text-red-600 hover:text-red-900", title: "Cancel Order", children: _jsx(XCircleIcon, { className: "h-5 w-5" }) })), _jsx("button", { onClick: () => handleDeleteOrder(order.id), className: "text-red-600 hover:text-red-900", title: "Delete Order", children: _jsx(TrashIcon, { className: "h-5 w-5" }) })] }));
    };
    if (ordersLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" }) }));
    }
    if (ordersError) {
        return (_jsx("div", { className: "rounded-md bg-red-50 p-4", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(ExclamationTriangleIcon, { className: "h-5 w-5 text-red-400", "aria-hidden": "true" }) }), _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: "Error loading orders" }), _jsx("div", { className: "mt-2 text-sm text-red-700", children: _jsx("p", { children: ordersError }) }), _jsx("div", { className: "mt-4", children: _jsxs("button", { type: "button", onClick: () => dispatch(fetchOrders()), className: "inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500", children: [_jsx(ArrowPathIcon, { className: "-ml-0.5 mr-2 h-4 w-4", "aria-hidden": "true" }), "Retry"] }) })] })] }) }));
    }
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "sm:flex sm:items-center", children: [_jsxs("div", { className: "sm:flex-auto", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Orders" }), _jsx("p", { className: "mt-2 text-sm text-gray-700", children: "A list of all orders including their ID, customer, date, status and total." })] }), _jsxs("div", { className: "mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4", children: [_jsxs("button", { type: "button", onClick: () => setShowAddForm(true), className: "inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto", children: [_jsx(PlusIcon, { className: "h-4 w-4 mr-2" }), "Add Order"] }), _jsxs("button", { type: "button", onClick: handleClearAllOrders, className: "inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto", children: [_jsx(ExclamationTriangleIcon, { className: "h-4 w-4 mr-2" }), "Clear All"] })] })] }), _jsxs("div", { className: "mt-4 flex items-center gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3", children: _jsx(MagnifyingGlassIcon, { className: "h-5 w-5 text-gray-400", "aria-hidden": "true" }) }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search orders...", className: "block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" })] }), _jsx("select", { value: statusFilter, onChange: (e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }, className: "rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500", children: statusOptions.map(option => (_jsx("option", { value: option, children: option }, option))) }), _jsx("select", { value: dateFilter, onChange: (e) => {
                            setDateFilter(e.target.value);
                            setCurrentPage(1);
                        }, className: "rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500", children: dateOptions.map(option => (_jsx("option", { value: option, children: option }, option))) }), _jsxs("select", { value: itemsPerPage, onChange: (e) => {
                            const newItemsPerPage = parseInt(e.target.value);
                            setItemsPerPage(newItemsPerPage);
                            dispatch(setOrderItemsPerPage(newItemsPerPage));
                            setCurrentPage(1);
                        }, className: "rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500", children: [_jsx("option", { value: "5", children: "5 per page" }), _jsx("option", { value: "10", children: "10 per page" }), _jsx("option", { value: "20", children: "20 per page" }), _jsx("option", { value: "50", children: "50 per page" })] })] }), _jsxs("div", { className: "mt-8", children: [_jsx("div", { className: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { scope: "col", className: "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6", children: "Order ID" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Customer" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Date & Time" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Status" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Items" }), _jsx("th", { scope: "col", className: "px-3 py-3.5 text-left text-sm font-semibold text-gray-900", children: "Total Amount" }), _jsx("th", { scope: "col", className: "relative py-3.5 pl-3 pr-4 sm:pr-6", children: _jsx("span", { className: "sr-only", children: "Actions" }) })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200 bg-white", children: paginatedOrders.map((order) => (_jsxs("tr", { children: [_jsx("td", { className: "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6", children: order.id }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: order.customer }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: formatDate(order.created_at) }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: getStatusBadge(order.status) }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: hasItems(order) ? order.items.length : 0 }), _jsx("td", { className: "whitespace-nowrap px-3 py-4 text-sm text-gray-500", children: formatPrice(order.total_amount) }), _jsx("td", { className: "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6", children: renderOrderActions(order) })] }, order.id))) })] }) }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsx("div", { className: "flex items-center gap-4", children: _jsxs("div", { className: "flex-1 text-sm text-gray-700", children: ["Showing ", _jsx("span", { className: "font-medium", children: ((currentPage - 1) * itemsPerPage) + 1 }), " to", ' ', _jsx("span", { className: "font-medium", children: Math.min(currentPage * itemsPerPage, filteredOrders.length) }), ' ', "of ", _jsx("span", { className: "font-medium", children: filteredOrders.length }), " orders"] }) }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs("button", { onClick: () => setCurrentPage(prev => Math.max(1, prev - 1)), disabled: currentPage === 1, className: "relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50", children: [_jsx("span", { className: "sr-only", children: "Previous" }), _jsx(ChevronLeftIcon, { className: "h-5 w-5", "aria-hidden": "true" })] }), [...Array(totalPages)].map((_, i) => {
                                        const page = i + 1;
                                        const isCurrentPage = page === currentPage;
                                        const isNearCurrentPage = Math.abs(page - currentPage) <= 1;
                                        const isFirstPage = page === 1;
                                        const isLastPage = page === totalPages;
                                        if (isCurrentPage || isNearCurrentPage || isFirstPage || isLastPage) {
                                            return (_jsxs(React.Fragment, { children: [!isNearCurrentPage && !isFirstPage && page === currentPage - 2 && (_jsx("span", { className: "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0", children: "..." })), _jsx("button", { onClick: () => setCurrentPage(page), className: `relative inline-flex items-center px-4 py-2 text-sm font-semibold ${isCurrentPage
                                                            ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'}`, children: page }), !isNearCurrentPage && !isLastPage && page === currentPage + 2 && (_jsx("span", { className: "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0", children: "..." }))] }, page));
                                        }
                                        return null;
                                    }), _jsxs("button", { onClick: () => setCurrentPage(prev => Math.min(totalPages, prev + 1)), disabled: currentPage === totalPages, className: "relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50", children: [_jsx("span", { className: "sr-only", children: "Next" }), _jsx(ChevronRightIcon, { className: "h-5 w-5", "aria-hidden": "true" })] })] })] })] }), showAddForm && (_jsx(AddOrderForm, { onClose: () => setShowAddForm(false) })), viewOrderModal && selectedOrderState && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-4xl", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold", children: "Order Details" }), _jsx("button", { onClick: () => {
                                        setViewOrderModal(false);
                                        setSelectedOrderState(null);
                                        if (onClose)
                                            onClose();
                                    }, className: "text-gray-400 hover:text-gray-500", children: _jsx(XCircleIcon, { className: "h-6 w-6" }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Order ID" }), _jsx("p", { className: "font-medium", children: selectedOrderState.id })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Date & Time" }), _jsx("p", { className: "font-medium", children: formatDate(selectedOrderState.created_at) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Customer" }), _jsx("p", { className: "font-medium", children: selectedOrderState.customer })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Status" }), _jsx("div", { children: getStatusBadge(selectedOrderState.status) })] })] }), _jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "Order Items" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Product" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Quantity" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Unit Price" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "Total" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: selectedOrderState.items.length > 0 ? (selectedOrderState.items.map((item, index) => {
                                                    const product = item.product;
                                                    const isProductDeleted = !product || Object.keys(product).length === 0 || item.product_id === null;
                                                    const productName = isProductDeleted
                                                        ? (item.product_name || "Product Deleted")
                                                        : product.name;
                                                    const productSku = isProductDeleted
                                                        ? (item.product_sku || "Unknown SKU")
                                                        : product.sku;
                                                    return (_jsxs("tr", { children: [_jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: [productName, ' ', _jsxs("span", { className: `text-gray-500 ${isProductDeleted ? 'italic' : ''}`, children: ["(", productSku, ")", isProductDeleted && ' - Product deleted from inventory'] }), item.product?.is_serialized && serialsByOrderItem[item.product_id]?.length > 0 && (_jsxs("div", { className: "text-xs text-blue-700 mt-1", children: ["Serials: ", serialsByOrderItem[item.product_id].join(', ')] }))] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: item.quantity }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: formatPrice(item.price) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: formatPrice((item.quantity * item.price)) })] }, index));
                                                })) : (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "px-6 py-4 text-center text-sm text-gray-500", children: "No items in this order" }) })) })] }) }), _jsx("div", { className: "mt-4 text-right", children: _jsxs("p", { className: "text-lg font-medium", children: ["Total Amount: ", formatPrice(selectedOrderState.total_amount)] }) })] }), _jsxs("div", { className: "mt-6 flex justify-end space-x-3", children: [_jsxs("button", { type: "button", onClick: () => handlePrintOrder(selectedOrderState), className: "inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500", children: [_jsx(PrinterIcon, { className: "h-5 w-5 mr-2" }), "Print Order"] }), _jsx("button", { type: "button", onClick: () => {
                                        setViewOrderModal(false);
                                        setSelectedOrderState(null);
                                    }, className: "inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500", children: "Close" })] })] }) }))] }));
}

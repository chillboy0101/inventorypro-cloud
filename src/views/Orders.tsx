import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchOrders,
  updateOrderStatus,
  setLoading,
  deleteOrder,
  clearAllOrders,
} from '../store/slices/ordersSlice';
import { setOrderItemsPerPage } from '../store/slices/settingsSlice';
import { useAppSettings } from '../hooks/useAppSettings';
import { formatCurrency } from '../utils/formatters';
import {
  PlusIcon,
  ArrowPathIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PrinterIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { ordersApi } from '../lib/api';
import type { Database } from '../types/supabase';
import type { Order, OrderItem, Product } from '../store/types';
import { format } from 'date-fns';
import AddOrderForm from '../components/AddOrderForm';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';

type OrderRow = Database['public']['Tables']['orders']['Row'];

interface OrderWithItems extends Order {
  items: (OrderItem & {
    product?: Product;
  })[];
}

function hasItems(order: Order | OrderWithItems): order is OrderWithItems {
  return (
    'items' in order && 
    Array.isArray(order.items) && 
    order.items.length > 0 &&
    order.items.every(item => 'product_id' in item)
  );
}

// Define status options for dropdowns
const statusOptions = ['All Status', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const dateOptions = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'];

export default function Orders({ initialOrderId, onClose }: { initialOrderId?: string; onClose?: () => void } = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const ordersState = useSelector((state: RootState) => state.orders);
  const settings = useSelector((state: RootState) => state.settings);
  const { formatPrice } = useAppSettings();
  const location = useLocation();
  
  const [statusFilter, setStatusFilter] = useState(statusOptions[0]);
  const [dateFilter, setDateFilter] = useState(dateOptions[1]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(settings.orderItemsPerPage || 5);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewOrderModal, setViewOrderModal] = useState(false);
  const [selectedOrderState, setSelectedOrderState] = useState<OrderWithItems | null>(null);
  const [serialsByOrderItem, setSerialsByOrderItem] = useState<{ [orderItemId: string]: string[] }>({});

  const orders = ordersState.items as OrderWithItems[];
  const ordersLoading = ordersState.loading;
  const ordersError = ordersState.error;

  useEffect(() => {
    console.log('Initial load - fetching orders and products');
    dispatch(fetchOrders());
  }, [dispatch]);

  useEffect(() => {
    if (viewOrderModal && selectedOrderState) {
      (async () => {
        const serialsMap: { [orderItemId: string]: string[] } = {};
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
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function getDateFromFilter(filter: string): Date {
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

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return `Today, ${format(date, 'hh:mm a')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(date, 'hh:mm a')}`;
    } else {
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

  function getStatusBadge(status: OrderRow['status']) {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-orange-100 text-orange-800',
      shipped: 'bg-green-100 text-green-800',
      delivered: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      dispatch(setLoading(true));
      await dispatch(deleteOrder(orderId)).unwrap();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleStatusUpdate = async (id: string, status: Order['status']) => {
    try {
      await dispatch(updateOrderStatus({ id, status })).unwrap();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const handleViewOrder = (order: OrderRow) => {
    if (!order) return;
    
    // If the order already has items, use them directly
    if (hasItems(order)) {
      setSelectedOrderState(order as OrderWithItems);
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

  const handlePrintOrder = async (order: OrderRow) => {
    try {
      // Fetch the complete order with items if not already loaded
      let orderWithItems: OrderWithItems;
      if (hasItems(order)) {
        orderWithItems = order as OrderWithItems;
      } else {
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
                  `}).join('')}
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
    } catch (error) {
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
    } catch (error) {
      console.error('Error clearing all orders:', error);
      alert('Failed to clear all orders. Please try again.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const renderOrderActions = (order: OrderWithItems) => {
    const renderStatusButton = () => {
      switch (order.status) {
        case 'pending':
          return (
            <button
              onClick={() => handleStatusUpdate(order.id, 'processing')}
              className="text-orange-600 hover:text-orange-900"
              title="Mark as Processing"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          );
        case 'processing':
          return (
            <button
              onClick={() => handleStatusUpdate(order.id, 'shipped')}
              className="text-blue-600 hover:text-blue-900"
              title="Mark as Shipped"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          );
        case 'shipped':
          return (
            <button
              onClick={() => handleStatusUpdate(order.id, 'delivered')}
              className="text-green-600 hover:text-green-900"
              title="Mark as Delivered"
            >
              <CheckCircleIcon className="h-5 w-5" />
            </button>
          );
        default:
          return null;
      }
    };

    return (
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => handleViewOrder(order)}
          className="text-blue-600 hover:text-blue-900"
          title="View Order"
        >
          <EyeIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => handlePrintOrder(order)}
          className="text-gray-600 hover:text-gray-900"
          title="Print Order"
        >
          <PrinterIcon className="h-5 w-5" />
        </button>
        {renderStatusButton()}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <button
            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
            className="text-red-600 hover:text-red-900"
            title="Cancel Order"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={() => handleDeleteOrder(order.id)}
          className="text-red-600 hover:text-red-900"
          title="Delete Order"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    );
  };

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{ordersError}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => dispatch(fetchOrders())}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowPathIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-2 text-sm text-gray-700">A list of all orders including their ID, customer, date, status and total.</p>
        </div>
        <div className="flex flex-col xs:flex-row flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full xs:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Order
          </button>
          <button
            type="button"
            onClick={handleClearAllOrders}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-full xs:w-auto"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            Clear All
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders..."
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusOptions[number]);
            setCurrentPage(1);
          }}
          className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {statusOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value as typeof dateOptions[number]);
            setCurrentPage(1);
          }}
          className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {dateOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            const newItemsPerPage = parseInt(e.target.value);
            setItemsPerPage(newItemsPerPage);
            dispatch(setOrderItemsPerPage(newItemsPerPage));
            setCurrentPage(1);
          }}
          className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-8 overflow-x-auto">
        <div className="min-w-[700px] sm:min-w-full overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Order ID
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Customer
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date & Time
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Items
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Total Amount
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedOrders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {order.id}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {order.customer}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {hasItems(order) ? order.items.length : 0}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    {renderOrderActions(order)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-1 text-sm text-gray-700">
              Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
              </span>{' '}
              of <span className="font-medium">{filteredOrders.length}</span> orders
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              const isCurrentPage = page === currentPage;
              const isNearCurrentPage = Math.abs(page - currentPage) <= 1;
              const isFirstPage = page === 1;
              const isLastPage = page === totalPages;

              if (isCurrentPage || isNearCurrentPage || isFirstPage || isLastPage) {
                return (
                  <React.Fragment key={page}>
                    {!isNearCurrentPage && !isFirstPage && page === currentPage - 2 && (
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        isCurrentPage
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      }`}
                    >
                      {page}
                    </button>
                    {!isNearCurrentPage && !isLastPage && page === currentPage + 2 && (
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                        ...
                      </span>
                    )}
                  </React.Fragment>
                );
              }
              return null;
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Order Modal */}
      {showAddForm && (
        <AddOrderForm onClose={() => setShowAddForm(false)} />
      )}

      {/* View Order Modal */}
      {viewOrderModal && selectedOrderState && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                onClick={() => {
                  setViewOrderModal(false);
                  setSelectedOrderState(null);
                  if (onClose) onClose();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">{selectedOrderState.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">
                  {formatDate(selectedOrderState.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{selectedOrderState.customer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div>{getStatusBadge(selectedOrderState.status)}</div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrderState.items.length > 0 ? (
                      selectedOrderState.items.map((item, index) => {
                        const product = item.product;
                        const isProductDeleted = !product || Object.keys(product).length === 0 || item.product_id === null;
                        const productName = isProductDeleted 
                          ? (item.product_name || "Product Deleted") 
                          : product.name;
                        const productSku = isProductDeleted 
                          ? (item.product_sku || "Unknown SKU") 
                          : product.sku;
                          
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {productName}{' '}
                              <span className={`text-gray-500 ${isProductDeleted ? 'italic' : ''}`}>
                                ({productSku})
                                {isProductDeleted && ' - Product deleted from inventory'}
                              </span>
                              {item.product?.is_serialized && serialsByOrderItem[item.product_id]?.length > 0 && (
                                <div className="text-xs text-blue-700 mt-1">
                                  Serials: {serialsByOrderItem[item.product_id].join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatPrice(item.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatPrice((item.quantity * item.price))}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          No items in this order
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-right">
                <p className="text-lg font-medium">
                  Total Amount: {formatPrice(selectedOrderState.total_amount)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => handlePrintOrder(selectedOrderState)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PrinterIcon className="h-5 w-5 mr-2" />
                Print Order
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewOrderModal(false);
                  setSelectedOrderState(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
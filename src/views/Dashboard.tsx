import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { fetchProducts } from '../store/slices/inventorySlice';
import { fetchOrders } from '../store/slices/ordersSlice';
import { useAppSettings } from '../hooks/useAppSettings';
import InventoryTrends from '../components/InventoryTrends';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowUpIcon,
  QrCodeIcon,
  ArrowsUpDownIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: products, loading: productsLoading } = useSelector((state: RootState) => state.inventory);
  const { items: orders, loading: ordersLoading } = useSelector((state: RootState) => state.orders);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useAppSettings();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch products and orders
        await Promise.all([
          dispatch(fetchProducts()),
          dispatch(fetchOrders())
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dispatch]);

  useEffect(() => {
    // Update low stock items whenever products change
    const lowStock = products
      .filter(product => 
        // Filter out ghost/deleted products
        !product.id.startsWith('GHOST-') && 
        !product.name.startsWith('[DELETED]') && 
        !product.sku.startsWith('DELETED-') &&
        // Low stock condition
        product.stock <= product.reorder_level
      )
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
    setLowStockItems(lowStock);
  }, [products]);

  // Get the 5 most recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Calculate order stats
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  const handleGenerateReport = async () => {
    try {
      // Get current date for filename
      const date = new Date().toISOString().split('T')[0];
      
      // Prepare report data
      const reportData = {
        generatedAt: new Date().toISOString(),
        inventorySummary: {
          totalProducts: products.length,
          lowStockItems: products.filter(p => p.stock <= p.reorder_level).length,
          outOfStockItems: products.filter(p => p.stock === 0).length,
          totalValue: products.reduce((sum, p) => sum + (p.stock * (p.selling_price || 0)), 0),
        },
        recentOrders: orders.slice(0, 5).map(order => ({
          id: order.id,
          customer: order.customer,
          status: order.status,
          total: order.total_amount,
          date: order.created_at,
        })),
        lowStockItems: products
          .filter(p => p.stock <= p.reorder_level)
          .map(p => ({
            name: p.name,
            sku: p.sku,
            currentStock: p.stock,
            reorderLevel: p.reorder_level,
            location: p.location,
          })),
      };

      // Convert to JSON string with formatting
      const jsonString = JSON.stringify(reportData, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${date}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  if (loading || productsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{orderStats.total}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{orderStats.pending}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{orderStats.completed}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingDownIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cancelled Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{orderStats.cancelled}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Items - horizontally scrollable on mobile */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Low Stock Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[400px] sm:min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-center text-gray-500">No low stock items</td>
                </tr>
              ) : (
                lowStockItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{item.sku}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{item.stock}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{item.reorder_level}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{item.location}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders - horizontally scrollable on mobile */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[400px] sm:min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-center text-gray-500">No recent orders</td>
                </tr>
              ) : (
                recentOrders.map((order, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-900">{order.id}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{order.customer}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{order.status}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{formatPrice(order.total_amount)}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Trends Chart - horizontally scrollable on mobile */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Inventory Trends</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[350px] sm:min-w-0">
            <InventoryTrends />
          </div>
        </div>
      </div>

      {/* Generate Report Button */}
      <div className="mt-8 flex flex-col xs:flex-row justify-end gap-2 xs:space-x-3 w-full">
        <button
          onClick={handleGenerateReport}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full xs:w-auto"
        >
          Generate Inventory Report
        </button>
      </div>
    </div>
  );
};

export default Dashboard; 
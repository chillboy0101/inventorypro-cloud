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
    <div className="p-6">
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

      {/* Inventory Trends Chart */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Inventory Trends</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <InventoryTrends />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Import CSV Card */}
          <Link
            to="/import"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DocumentArrowUpIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Import CSV</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Import products from a CSV file
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Add Product Card */}
          <Link
            to="/products"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <QrCodeIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Add Product</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add a new product to inventory
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Stock Adjustments Card */}
          <Link
            to="/inventory"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ArrowsUpDownIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Stock Adjustments</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Adjust inventory stock levels
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Generate Report Card */}
          <button
            onClick={handleGenerateReport}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 text-left"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <DocumentChartBarIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Generate Report</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Download inventory report
                  </p>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
            <div className="mt-4">
              {recentOrders.length > 0 ? (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {recentOrders.map((order) => (
                      <li key={order.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Order #{order.id}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {order.customer} - {formatPrice(order.total_amount)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className={`
                              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                              ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                              ${order.status === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
                              ${order.status === 'shipped' ? 'bg-purple-100 text-purple-800' : ''}
                            `}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent orders</p>
              )}
              <div className="mt-6">
                <Link
                  to="/orders"
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View All Orders
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900">Low Stock Items</h2>
            <div className="mt-4">
              {lowStockItems.length > 0 ? (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {lowStockItems.map((item) => (
                      <li key={item.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Current Stock: {item.stock} (Min: {item.reorder_level})
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No low stock items</p>
              )}
              <div className="mt-6">
                <Link
                  to="/inventory"
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Inventory
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
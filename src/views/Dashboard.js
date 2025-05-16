import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../store/slices/inventorySlice';
import { fetchOrders } from '../store/slices/ordersSlice';
import { useAppSettings } from '../hooks/useAppSettings';
import InventoryTrends from '../components/InventoryTrends';
import { CurrencyDollarIcon, ShoppingCartIcon, ExclamationTriangleIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, DocumentArrowUpIcon, QrCodeIcon, ArrowsUpDownIcon, DocumentChartBarIcon, } from '@heroicons/react/24/outline';
const Dashboard = () => {
    const dispatch = useDispatch();
    const { items: products, loading: productsLoading } = useSelector((state) => state.inventory);
    const { items: orders, loading: ordersLoading } = useSelector((state) => state.orders);
    const [lowStockItems, setLowStockItems] = useState([]);
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
            }
            catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
            finally {
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
            product.stock <= product.reorder_level)
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
        }
        catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report. Please try again.');
        }
    };
    if (loading || productsLoading || ordersLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Dashboard" }), _jsxs("div", { className: "mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(ShoppingCartIcon, { className: "h-6 w-6 text-gray-400" }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Total Orders" }), _jsx("dd", { className: "flex items-baseline", children: _jsx("div", { className: "text-2xl font-semibold text-gray-900", children: orderStats.total }) })] }) })] }) }) }), _jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(CurrencyDollarIcon, { className: "h-6 w-6 text-gray-400" }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Pending Orders" }), _jsx("dd", { className: "flex items-baseline", children: _jsx("div", { className: "text-2xl font-semibold text-gray-900", children: orderStats.pending }) })] }) })] }) }) }), _jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(ArrowTrendingUpIcon, { className: "h-6 w-6 text-gray-400" }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Completed Orders" }), _jsx("dd", { className: "flex items-baseline", children: _jsx("div", { className: "text-2xl font-semibold text-gray-900", children: orderStats.completed }) })] }) })] }) }) }), _jsx("div", { className: "bg-white overflow-hidden shadow rounded-lg", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(ArrowTrendingDownIcon, { className: "h-6 w-6 text-gray-400" }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: "Cancelled Orders" }), _jsx("dd", { className: "flex items-baseline", children: _jsx("div", { className: "text-2xl font-semibold text-gray-900", children: orderStats.cancelled }) })] }) })] }) }) })] }), _jsxs("div", { className: "mt-8", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Inventory Trends" }), _jsx("div", { className: "bg-white shadow rounded-lg p-6", children: _jsx(InventoryTrends, {}) })] }), _jsxs("div", { className: "mt-8", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3", children: [_jsx(Link, { to: "/import", className: "bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center", children: _jsx(DocumentArrowUpIcon, { className: "h-6 w-6 text-blue-600" }) }) }), _jsxs("div", { className: "ml-5 w-0 flex-1", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Import CSV" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Import products from a CSV file" })] })] }) }) }), _jsx(Link, { to: "/products", className: "bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center", children: _jsx(QrCodeIcon, { className: "h-6 w-6 text-green-600" }) }) }), _jsxs("div", { className: "ml-5 w-0 flex-1", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Add Product" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Add a new product to inventory" })] })] }) }) }), _jsx(Link, { to: "/inventory", className: "bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center", children: _jsx(ArrowsUpDownIcon, { className: "h-6 w-6 text-purple-600" }) }) }), _jsxs("div", { className: "ml-5 w-0 flex-1", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Stock Adjustments" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Adjust inventory stock levels" })] })] }) }) }), _jsx("button", { onClick: handleGenerateReport, className: "bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 text-left", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center", children: _jsx(DocumentChartBarIcon, { className: "h-6 w-6 text-yellow-600" }) }) }), _jsxs("div", { className: "ml-5 w-0 flex-1", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Generate Report" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Download inventory report" })] })] }) }) })] })] }), _jsxs("div", { className: "mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsx("div", { className: "bg-white shadow rounded-lg", children: _jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Recent Orders" }), _jsxs("div", { className: "mt-4", children: [recentOrders.length > 0 ? (_jsx("div", { className: "flow-root", children: _jsx("ul", { className: "-my-5 divide-y divide-gray-200", children: recentOrders.map((order) => (_jsx("li", { className: "py-4", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900 truncate", children: ["Order #", order.id] }), _jsxs("p", { className: "text-sm text-gray-500 truncate", children: [order.customer, " - ", formatPrice(order.total_amount)] }), _jsx("p", { className: "text-xs text-gray-400", children: new Date(order.created_at).toLocaleDateString() })] }), _jsx("div", { children: _jsx("span", { className: `
                              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                              ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                              ${order.status === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
                              ${order.status === 'shipped' ? 'bg-purple-100 text-purple-800' : ''}
                            `, children: order.status.charAt(0).toUpperCase() + order.status.slice(1) }) })] }) }, order.id))) }) })) : (_jsx("p", { className: "text-gray-500 text-sm", children: "No recent orders" })), _jsx("div", { className: "mt-6", children: _jsx(Link, { to: "/orders", className: "w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50", children: "View All Orders" }) })] })] }) }), _jsx("div", { className: "bg-white shadow rounded-lg", children: _jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Low Stock Items" }), _jsxs("div", { className: "mt-4", children: [lowStockItems.length > 0 ? (_jsx("div", { className: "flow-root", children: _jsx("ul", { className: "-my-5 divide-y divide-gray-200", children: lowStockItems.map((item) => (_jsx("li", { className: "py-4", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(ExclamationTriangleIcon, { className: "h-6 w-6 text-yellow-400" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: item.name }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Current Stock: ", item.stock, " (Min: ", item.reorder_level, ")"] })] })] }) }, item.id))) }) })) : (_jsx("p", { className: "text-gray-500 text-sm", children: "No low stock items" })), _jsx("div", { className: "mt-6", children: _jsx(Link, { to: "/inventory", className: "w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50", children: "View Inventory" }) })] })] }) })] })] }));
};
export default Dashboard;

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/slices/inventorySlice';
import { fetchOrders } from '../store/slices/ordersSlice';
import { useAppSettings } from '../hooks/useAppSettings';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import InventoryCategories from '../components/InventoryCategories';
// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);
const Reports = () => {
    const dispatch = useDispatch();
    const { items: products } = useSelector((state) => state.inventory);
    const { items: orders } = useSelector((state) => state.orders);
    const { formatPrice } = useAppSettings();
    const [dateRange, setDateRange] = useState(() => {
        // Try to get saved date range from localStorage, default to '7' if not found
        return localStorage.getItem('reportDateRange') || '7';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    // Update localStorage when dateRange changes
    useEffect(() => {
        localStorage.setItem('reportDateRange', dateRange);
    }, [dateRange]);
    useEffect(() => {
        dispatch(fetchProducts());
        dispatch(fetchOrders());
    }, [dispatch]);
    // Filter out ghost/deleted products
    const activeProducts = products.filter(product => !product.id.startsWith('GHOST-') &&
        !product.name.startsWith('[DELETED]') &&
        !product.sku.startsWith('DELETED-'));
    // Filter orders based on date range and status
    const filteredOrders = orders.filter(order => {
        // Exclude cancelled orders
        if (order.status === 'cancelled')
            return false;
        const orderDate = new Date(order.created_at);
        const now = new Date();
        // Handle special date ranges
        if (dateRange === 'all')
            return true;
        if (dateRange === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return orderDate >= today;
        }
        if (dateRange === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            const dayAfterYesterday = new Date();
            dayAfterYesterday.setDate(dayAfterYesterday.getDate() - 1);
            dayAfterYesterday.setHours(23, 59, 59, 999);
            return orderDate >= yesterday && orderDate <= dayAfterYesterday;
        }
        if (dateRange === '3') {
            // Last 3 days
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            return orderDate >= threeDaysAgo;
        }
        // Default case: use numeric value for days
        const days = parseInt(dateRange);
        return (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24) <= days;
    });
    // Calculate top selling products
    const getTopProducts = () => {
        const productSales = new Map();
        filteredOrders.forEach((order) => {
            // Skip cancelled orders
            if (order.status === 'cancelled')
                return;
            order.items?.forEach((item) => {
                const currentSales = productSales.get(item.product_id) || 0;
                productSales.set(item.product_id, currentSales + item.quantity);
            });
        });
        const topProducts = Array.from(productSales.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([productId, sales]) => {
            const product = activeProducts.find(p => p.id === productId);
            return {
                name: product?.name || 'Unknown Product',
                sales
            };
        });
        return topProducts;
    };
    // Calculate monthly revenue (excluding cancelled orders)
    const getMonthlyRevenue = () => {
        const currentMonth = new Date().getMonth();
        const thisMonthOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate.getMonth() === currentMonth && order.status !== 'cancelled';
        });
        return thisMonthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    };
    // Calculate sales performance data (excluding cancelled orders)
    const getSalesData = () => {
        const monthlySales = new Array(6).fill(0);
        filteredOrders.forEach((order) => {
            if (order.status === 'cancelled')
                return;
            const orderDate = new Date(order.created_at);
            const monthIndex = orderDate.getMonth();
            if (monthIndex >= 0 && monthIndex < 6) {
                monthlySales[monthIndex] += order.total_amount || 0;
            }
        });
        return monthlySales;
    };
    // Calculate top selling product
    const getTopProduct = () => {
        const productSales = new Map();
        filteredOrders.forEach((order) => {
            order.items?.forEach((item) => {
                const currentSales = productSales.get(item.product_id) || 0;
                productSales.set(item.product_id, currentSales + item.quantity);
            });
        });
        let topProductId = '';
        let maxSales = 0;
        productSales.forEach((sales, productId) => {
            if (sales > maxSales) {
                maxSales = sales;
                topProductId = productId;
            }
        });
        const topProduct = activeProducts.find(p => p.id === topProductId);
        return {
            name: topProduct?.name || 'No sales',
            sales: maxSales
        };
    };
    // Calculate revenue change percentage (excluding cancelled orders)
    const getRevenueChange = () => {
        const currentMonth = new Date().getMonth();
        const lastMonth = currentMonth - 1;
        const thisMonthRevenue = filteredOrders
            .filter(order => new Date(order.created_at).getMonth() === currentMonth &&
            order.status !== 'cancelled')
            .reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const lastMonthRevenue = filteredOrders
            .filter(order => new Date(order.created_at).getMonth() === lastMonth &&
            order.status !== 'cancelled')
            .reduce((sum, order) => sum + (order.total_amount || 0), 0);
        if (lastMonthRevenue === 0)
            return 0;
        return ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    };
    // Calculate average order value (excluding cancelled orders)
    const getAverageOrderValue = () => {
        const validOrders = filteredOrders.filter(order => order.status !== 'cancelled');
        if (validOrders.length === 0)
            return 0;
        const total = validOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        return total / validOrders.length;
    };
    // Calculate inventory turnover (excluding cancelled orders)
    const getInventoryTurnover = () => {
        const totalInventory = activeProducts.reduce((sum, product) => sum + (product.stock || 0), 0);
        const soldItems = filteredOrders
            .filter(order => order.status !== 'cancelled')
            .reduce((sum, order) => sum + (order.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0);
        if (totalInventory === 0)
            return 0;
        return (soldItems / totalInventory) * (365 / parseInt(dateRange));
    };
    // Add configuration for operating expenses percentage
    const OPERATING_EXPENSES_PERCENTAGE = 20; // Can be adjusted as needed
    const SUSPICIOUS_MARGIN_THRESHOLD = 70; // Flag margins above 70% for review
    const MIN_ACCEPTABLE_MARGIN = -30; // Flag margins below -30% for review
    // Enhanced COGS calculation with validation (excluding cancelled orders)
    const calculateCOGS = (startDate, endDate) => {
        const issues = [];
        const cogs = filteredOrders
            .filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= startDate &&
                orderDate <= endDate &&
                order.status !== 'cancelled';
        })
            .reduce((total, order) => {
            const orderCost = order.items?.reduce((cost, item) => {
                const product = activeProducts.find(p => p.id === item.product_id);
                if (!product) {
                    issues.push(`Product not found for order item: ${item.product_id}`);
                    return cost;
                }
                if (!product.cost_price || product.cost_price <= 0) {
                    issues.push(`Invalid cost price for product: ${product.name} (${product.id})`);
                    return cost;
                }
                if (item.price < product.cost_price) {
                    issues.push(`Selling price (${item.price}) is lower than cost price (${product.cost_price}) for product: ${product.name}`);
                }
                return cost + (product.cost_price * item.quantity);
            }, 0) || 0;
            return total + orderCost;
        }, 0);
        if (issues.length > 0) {
            console.warn('COGS Calculation Issues:', issues);
        }
        return cogs;
    };
    // Enhanced profit metrics calculation
    const calculateProfitMetrics = () => {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const revenue = getMonthlyRevenue();
        console.log('Revenue Breakdown:', {
            totalRevenue: revenue,
            orderCount: filteredOrders.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate.getMonth() === currentDate.getMonth();
            }).length,
            averageOrderValue: revenue / filteredOrders.length || 0
        });
        const cogs = calculateCOGS(startOfMonth, endOfMonth);
        console.log('COGS Breakdown:', {
            totalCOGS: cogs,
            ordersAnalyzed: filteredOrders.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate >= startOfMonth && orderDate <= endOfMonth;
            }).length,
            averageCOGSPerOrder: cogs / filteredOrders.length || 0
        });
        // Log individual order details for verification
        filteredOrders.slice(0, 3).forEach(order => {
            const orderCost = order.items?.reduce((cost, item) => {
                const product = activeProducts.find(p => p.id === item.product_id);
                return cost + ((product?.cost_price || 0) * item.quantity);
            }, 0) || 0;
            console.log('Sample Order:', {
                orderId: order.id,
                date: new Date(order.created_at).toLocaleDateString(),
                revenue: order.total_amount,
                cogs: orderCost,
                margin: ((order.total_amount - orderCost) / order.total_amount * 100).toFixed(2) + '%',
                items: order.items?.map(item => {
                    const product = activeProducts.find(p => p.id === item.product_id);
                    return {
                        productId: item.product_id,
                        productName: product?.name,
                        quantity: item.quantity,
                        sellingPrice: item.price,
                        costPrice: product?.cost_price,
                        itemRevenue: item.price * item.quantity,
                        itemCost: (product?.cost_price || 0) * item.quantity
                    };
                })
            });
        });
        const grossProfit = revenue - cogs;
        const operatingExpenses = revenue * (OPERATING_EXPENSES_PERCENTAGE / 100);
        const netProfit = grossProfit - operatingExpenses;
        const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
        console.log('Final Calculations:', {
            revenue: revenue.toFixed(2),
            cogs: cogs.toFixed(2),
            grossProfit: grossProfit.toFixed(2),
            operatingExpenses: operatingExpenses.toFixed(2),
            netProfit: netProfit.toFixed(2),
            grossMargin: grossMargin.toFixed(2) + '%',
            netMargin: netMargin.toFixed(2) + '%'
        });
        return {
            revenue,
            cogs,
            grossProfit,
            operatingExpenses,
            netProfit,
            grossMargin,
            netMargin
        };
    };
    // Enhanced product profit calculation
    const calculateProductProfit = (productId) => {
        const salesData = filteredOrders.reduce((acc, order) => {
            const item = order.items?.find(i => i.product_id === productId);
            if (item) {
                acc.quantity += item.quantity;
                acc.revenue += item.price * item.quantity;
            }
            return acc;
        }, { quantity: 0, revenue: 0 });
        const product = activeProducts.find(p => p.id === productId);
        if (!product) {
            console.warn(`Product not found: ${productId}`);
            return { profit: 0, margin: 0 };
        }
        if (!product.cost_price || product.cost_price <= 0) {
            console.warn(`Invalid cost price for product: ${product.name} (${product.id})`);
            return { profit: 0, margin: 0 };
        }
        const totalCost = product.cost_price * salesData.quantity;
        const profit = salesData.revenue - totalCost;
        const margin = salesData.revenue > 0 ? (profit / salesData.revenue) * 100 : 0;
        // Log suspicious individual product margins
        if (margin > SUSPICIOUS_MARGIN_THRESHOLD || margin < MIN_ACCEPTABLE_MARGIN) {
            console.warn(`Suspicious margin for product ${product.name}: ${margin.toFixed(2)}%`);
            console.log('Product margin details:', {
                product: product.name,
                revenue: salesData.revenue,
                totalCost,
                profit,
                margin: `${margin.toFixed(2)}%`,
                costPrice: product.cost_price,
                quantitySold: salesData.quantity
            });
        }
        return { profit, margin };
    };
    // Get Top Profitable Products
    const getTopProfitableProducts = () => {
        const productProfits = activeProducts.map(product => {
            const { profit, margin } = calculateProductProfit(product.id);
            return {
                id: product.id,
                name: product.name,
                profit,
                margin
            };
        });
        return productProfits
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 5);
    };
    // Generate Sales Report
    const generateSalesReport = async () => {
        setLoading(true);
        try {
            const salesData = orders.map(order => ({
                orderId: order.id,
                date: new Date(order.created_at).toLocaleDateString(),
                supplier: order.supplier,
                totalAmount: order.total_amount,
                status: order.status,
                items: order.items?.map(item => ({
                    productId: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    productName: item.product?.name
                })) || []
            }));
            const blob = new Blob([JSON.stringify(salesData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Error generating sales report:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Generate Inventory Export
    const generateInventoryExport = async () => {
        setLoading(true);
        try {
            const inventoryData = activeProducts.map(product => ({
                id: product.id,
                name: product.name,
                sku: product.sku,
                category: product.category,
                quantity: product.stock, // Using stock instead of quantity
                price: product.selling_price || 0, // Using selling_price instead of price
                lastUpdated: new Date(product.updated_at).toLocaleDateString()
            }));
            const csvContent = [
                ['ID', 'Name', 'SKU', 'Category', 'Quantity', 'Price', 'Last Updated'],
                ...inventoryData.map(item => [
                    item.id,
                    item.name,
                    item.sku,
                    item.category,
                    item.quantity,
                    item.price,
                    item.lastUpdated
                ])
            ].map(row => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Error generating inventory export:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Generate Performance Analysis
    const generatePerformanceAnalysis = async () => {
        setLoading(true);
        try {
            const performanceData = {
                salesTrends: getSalesData(),
                topProducts: getTopProducts(),
                inventoryTurnover: getInventoryTurnover(),
                revenueGrowth: getRevenueChange()
            };
            const blob = new Blob([JSON.stringify(performanceData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `performance-analysis-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Error generating performance analysis:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Generate Financial Summary
    const generateFinancialSummary = async () => {
        setLoading(true);
        try {
            const monthlyRevenue = getMonthlyRevenue();
            const revenueChange = getRevenueChange();
            const averageOrderValue = getAverageOrderValue();
            const inventoryTurnover = getInventoryTurnover();
            const financialData = {
                revenue: {
                    monthly: monthlyRevenue,
                    change: revenueChange,
                    trend: getSalesData()
                },
                inventory: {
                    value: getTotalInventoryValue(),
                    turnover: inventoryTurnover
                },
                orders: {
                    total: orders.length,
                    average: averageOrderValue,
                    pending: orders.filter(o => o.status === 'pending').length
                },
                profitMargin: calculateProfitMetrics().grossMargin
            };
            const blob = new Blob([JSON.stringify(financialData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financial-summary-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Error generating financial summary:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Get Total Inventory Value (using cost price for accurate valuation)
    const getTotalInventoryValue = () => {
        return activeProducts.reduce((sum, product) => sum + ((product.cost_price || 0) * (product.stock || 0)), 0);
    };
    const topProduct = getTopProduct();
    const monthlyRevenue = getMonthlyRevenue();
    const revenueChange = getRevenueChange();
    const averageOrderValue = getAverageOrderValue();
    const inventoryTurnover = getInventoryTurnover();
    return (_jsxs("div", { className: "p-6 space-y-8", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Reports & Analytics" }), _jsxs("div", { className: "flex space-x-4", children: [_jsxs("select", { value: dateRange, onChange: (e) => setDateRange(e.target.value), className: "border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500", children: [_jsx("option", { value: "7", children: "Last 7 Days" }), _jsx("option", { value: "30", children: "Last 30 Days" }), _jsx("option", { value: "90", children: "Last 90 Days" }), _jsx("option", { value: "all", children: "All Time" }), _jsx("option", { value: "today", children: "Today" }), _jsx("option", { value: "yesterday", children: "Yesterday" }), _jsx("option", { value: "3", children: "Last 3 Days" })] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", placeholder: "Search reports...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "border border-gray-300 rounded-md pl-10 pr-4 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 w-64" }), _jsx(MagnifyingGlassIcon, { className: "h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6 border border-gray-100", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Key Metrics" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Monthly Revenue" }), _jsx("p", { className: "text-2xl font-bold", children: formatPrice(monthlyRevenue) }), _jsxs("div", { className: "flex items-center mt-1", children: [revenueChange >= 0 ? (_jsx(ArrowUpIcon, { className: "h-4 w-4 text-green-500" })) : (_jsx(ArrowDownIcon, { className: "h-4 w-4 text-red-500" })), _jsxs("span", { className: `text-sm ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`, children: [Math.abs(revenueChange).toFixed(1), "% vs last month"] })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Average Order Value" }), _jsx("p", { className: "text-2xl font-bold", children: formatPrice(averageOrderValue) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Inventory Turnover Rate" }), _jsxs("p", { className: "text-2xl font-bold", children: [inventoryTurnover.toFixed(2), "x"] })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6 border border-gray-100", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Top Products" }), _jsx("div", { className: "space-y-3", children: getTopProducts().map((product, index) => (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: product.name }), _jsxs("span", { className: "text-sm font-medium", children: [product.sales, " units"] })] }, index))) })] }), _jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-100", children: _jsx(InventoryCategories, {}) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6 border border-gray-100", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Financial Summary" }), _jsx("button", { onClick: generateFinancialSummary, disabled: loading, className: "px-4 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50", children: "Export Financial Summary" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: (() => {
                            const metrics = calculateProfitMetrics();
                            return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Total Revenue" }), _jsx("p", { className: "text-2xl font-bold", children: formatPrice(metrics.revenue) }), _jsxs("div", { className: "flex items-center", children: [revenueChange >= 0 ? (_jsx(ArrowUpIcon, { className: "h-4 w-4 text-green-500" })) : (_jsx(ArrowDownIcon, { className: "h-4 w-4 text-red-500" })), _jsxs("span", { className: `text-sm ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`, children: [Math.abs(revenueChange).toFixed(1), "% vs last month"] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Gross Profit" }), _jsx("p", { className: "text-2xl font-bold", children: formatPrice(metrics.grossProfit) }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Margin: ", metrics.grossMargin.toFixed(1), "%"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Net Profit" }), _jsx("p", { className: "text-2xl font-bold", children: formatPrice(metrics.netProfit) }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Margin: ", metrics.netMargin.toFixed(1), "%"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-gray-500", children: "COGS" }), _jsx("p", { className: "text-2xl font-bold", children: formatPrice(metrics.cogs) }), _jsx("p", { className: "text-sm text-gray-500", children: "Cost of goods sold" })] })] }));
                        })() }), _jsxs("div", { className: "mt-8", children: [_jsx("h4", { className: "text-md font-semibold text-gray-700 mb-4", children: "Most Profitable Products" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", children: getTopProfitableProducts().map(product => (_jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsx("p", { className: "font-medium text-gray-900 truncate", children: product.name }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: ["Profit: ", formatPrice(product.profit)] }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Margin: ", product.margin.toFixed(1), "%"] })] }, product.id))) })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6 border border-gray-100", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Performance Analysis" }), _jsx("button", { onClick: generatePerformanceAnalysis, disabled: loading, className: "px-4 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50", children: "Export Performance Report" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Top Product" }), _jsx("p", { className: "text-2xl font-bold truncate", children: topProduct.name }), _jsxs("p", { className: "text-sm text-green-600", children: [topProduct.sales, " units sold"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Average Order" }), _jsx("p", { className: "text-2xl font-bold", children: formatPrice(averageOrderValue) }), _jsx("p", { className: "text-sm text-gray-500", children: "Per transaction" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Inventory Turnover" }), _jsxs("p", { className: "text-2xl font-bold", children: [inventoryTurnover.toFixed(2), "x"] }), _jsx("p", { className: "text-sm text-gray-500", children: "Stock rotation rate" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Total Orders" }), _jsx("p", { className: "text-2xl font-bold", children: orders.length }), _jsx("p", { className: "text-sm text-gray-500", children: "All time" })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6 border border-gray-100", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Sales Trend" }), _jsx("div", { className: "h-[300px]", children: _jsx(Bar, { data: {
                                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                                datasets: [{
                                        label: 'Monthly Sales',
                                        data: getSalesData(),
                                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                                        borderColor: 'rgba(99, 102, 241, 1)',
                                        borderWidth: 1
                                    }]
                            }, options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: (value) => `$${value.toLocaleString()}`
                                        }
                                    }
                                }
                            } }) })] }), _jsxs("div", { className: "flex space-x-4", children: [_jsx("button", { onClick: generateSalesReport, disabled: loading, className: "px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50", children: "Export Sales Report" }), _jsx("button", { onClick: generateInventoryExport, disabled: loading, className: "px-4 py-2 bg-white text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50", children: "Export Inventory" })] })] }));
};
export default Reports;

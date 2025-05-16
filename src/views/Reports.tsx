import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchProducts } from '../store/slices/inventorySlice';
import { fetchOrders } from '../store/slices/ordersSlice';
import { useAppSettings } from '../hooks/useAppSettings';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Database } from '../types/supabase';
import InventoryCategories from '../components/InventoryCategories';

type ProductRow = Database['public']['Tables']['products']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];

interface Product extends ProductRow {
  last_adjustment?: {
    quantity: number;
    type: 'add' | 'subtract';
    reason: string;
    timestamp: string;
  };
}

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;  // This is the selling price at the time of order
  product?: ProductRow;
}

interface Order extends OrderRow {
  items?: OrderItem[];
  supplier?: string;
}

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Reports: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: products } = useSelector((state: RootState) => state.inventory) as { items: Product[] };
  const { items: orders } = useSelector((state: RootState) => state.orders) as { items: Order[] };
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
  const activeProducts = products.filter(product => 
    !product.id.startsWith('GHOST-') && 
    !product.name.startsWith('[DELETED]') && 
    !product.sku.startsWith('DELETED-')
  );

  // Filter orders based on date range and status
  const filteredOrders = orders.filter(order => {
    // Exclude cancelled orders
    if (order.status === 'cancelled') return false;
    
    const orderDate = new Date(order.created_at);
    const now = new Date();
    
    // Handle special date ranges
    if (dateRange === 'all') return true;
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
    const productSales = new Map<string, number>();
    
    filteredOrders.forEach((order: Order) => {
      // Skip cancelled orders
      if (order.status === 'cancelled') return;
      
      order.items?.forEach((item: OrderItem) => {
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
    
    filteredOrders.forEach((order: Order) => {
      if (order.status === 'cancelled') return;
      
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
    const productSales = new Map<string, number>();
    
    filteredOrders.forEach((order: Order) => {
      order.items?.forEach((item: OrderItem) => {
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
      .filter(order => 
        new Date(order.created_at).getMonth() === currentMonth && 
        order.status !== 'cancelled'
      )
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    const lastMonthRevenue = filteredOrders
      .filter(order => 
        new Date(order.created_at).getMonth() === lastMonth && 
        order.status !== 'cancelled'
      )
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    if (lastMonthRevenue === 0) return 0;
    return ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
  };

  // Calculate average order value (excluding cancelled orders)
  const getAverageOrderValue = () => {
    const validOrders = filteredOrders.filter(order => order.status !== 'cancelled');
    if (validOrders.length === 0) return 0;
    const total = validOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    return total / validOrders.length;
  };

  // Calculate inventory turnover (excluding cancelled orders)
  const getInventoryTurnover = () => {
    const totalInventory = activeProducts.reduce((sum, product) => sum + (product.stock || 0), 0);
    const soldItems = filteredOrders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => 
        sum + (order.items?.reduce((itemSum: number, item: OrderItem) => itemSum + item.quantity, 0) || 0), 0);
    
    if (totalInventory === 0) return 0;
    return (soldItems / totalInventory) * (365 / parseInt(dateRange));
  };

  // Add configuration for operating expenses percentage
  const OPERATING_EXPENSES_PERCENTAGE = 20; // Can be adjusted as needed
  const SUSPICIOUS_MARGIN_THRESHOLD = 70; // Flag margins above 70% for review
  const MIN_ACCEPTABLE_MARGIN = -30; // Flag margins below -30% for review

  // Enhanced COGS calculation with validation (excluding cancelled orders)
  const calculateCOGS = (startDate: Date, endDate: Date) => {
    const issues: string[] = [];
    
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
  const calculateProductProfit = (productId: string) => {
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
    } catch (error) {
      console.error('Error generating sales report:', error);
    } finally {
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
    } catch (error) {
      console.error('Error generating inventory export:', error);
    } finally {
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
    } catch (error) {
      console.error('Error generating performance analysis:', error);
    } finally {
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
    } catch (error) {
      console.error('Error generating financial summary:', error);
    } finally {
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

  return (
    <div className="p-2 sm:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">View your business performance, sales, and inventory trends.</p>
        </div>
        <div className="flex flex-col xs:flex-row flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={generateSalesReport}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full xs:w-auto"
            disabled={loading}
          >
            Export Sales Report
          </button>
          <button
            onClick={generateInventoryExport}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full xs:w-auto"
            disabled={loading}
          >
            Export Inventory CSV
          </button>
          <button
            onClick={generatePerformanceAnalysis}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full xs:w-auto"
            disabled={loading}
          >
            Export Performance
          </button>
          <button
            onClick={generateFinancialSummary}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 w-full xs:w-auto"
            disabled={loading}
          >
            Export Financials
          </button>
        </div>
      </div>

      {/* Filters and Date Range */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products or orders..."
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="3">Last 3 Days</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Summary Cards - stack on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-start">
          <span className="text-xs text-gray-500">Monthly Revenue</span>
          <span className="text-2xl font-bold text-gray-900">{formatPrice(monthlyRevenue)}</span>
          <span className={`text-sm mt-1 ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{revenueChange >= 0 ? <ArrowUpIcon className="h-4 w-4 inline" /> : <ArrowDownIcon className="h-4 w-4 inline" />} {Math.abs(revenueChange).toFixed(1)}%</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-start">
          <span className="text-xs text-gray-500">Avg. Order Value</span>
          <span className="text-2xl font-bold text-gray-900">{formatPrice(averageOrderValue)}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-start">
          <span className="text-xs text-gray-500">Inventory Turnover</span>
          <span className="text-2xl font-bold text-gray-900">{inventoryTurnover.toFixed(2)}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-start">
          <span className="text-xs text-gray-500">Top Product</span>
          <span className="text-lg font-bold text-gray-900">{topProduct.name}</span>
          <span className="text-sm text-gray-700">{topProduct.sales} sold</span>
        </div>
      </div>

      {/* Charts and Tables - horizontally scrollable on mobile */}
      <div className="overflow-x-auto">
        {/* Example: Bar chart for sales trends */}
        <div className="min-w-[350px] sm:min-w-0">
          <Bar
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [
                {
                  label: 'Sales',
                  data: getSalesData(),
                  backgroundColor: '#6366f1',
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: true, text: 'Sales Trends (Last 6 Months)' },
              },
            }}
          />
        </div>
      </div>

      {/* Top Products Table - horizontally scrollable on mobile */}
      <div className="overflow-x-auto">
        <div className="min-w-[400px] sm:min-w-0">
          <h2 className="text-lg font-semibold mb-2">Top Selling Products</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getTopProducts().map((product, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{product.sales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
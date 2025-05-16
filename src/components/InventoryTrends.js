import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, TimeScale, Title, Tooltip, Legend);
const periodOptions = [
    { value: 'today', label: 'Today', days: 0 },
    { value: 'yesterday', label: 'Yesterday', days: 1 },
    { value: '3days', label: 'Last 3 Days', days: 3 },
    { value: 'week', label: 'Last 7 Days', days: 7 },
    { value: '2weeks', label: 'Last 2 Weeks', days: 14 },
    { value: 'month', label: 'Last 30 Days', days: 30 },
    { value: 'quarter', label: 'Last 3 Months', days: 90 },
    { value: 'halfyear', label: 'Last 6 Months', days: 180 },
];
const InventoryTrends = () => {
    const [selectedPeriod, setSelectedPeriod] = useState(() => {
        return localStorage.getItem('inventoryTrendsPeriod') || 'week';
    });
    const [stockLevels, setStockLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const products = useSelector((state) => state.inventory.items);
    // Filter out ghost/deleted products
    const activeProducts = products.filter(product => !product.id.startsWith('GHOST-') &&
        !product.name.startsWith('[DELETED]') &&
        !product.sku.startsWith('DELETED-'));
    useEffect(() => {
        localStorage.setItem('inventoryTrendsPeriod', selectedPeriod);
        fetchStockLevels();
    }, [selectedPeriod]);
    useEffect(() => {
        const subscription = supabase
            .channel('stock-changes')
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'stock_adjustments'
        }, (payload) => {
            handleNewStockAdjustment(payload.new);
        })
            .subscribe();
        return () => {
            subscription.unsubscribe();
        };
    }, [activeProducts, selectedPeriod]);
    const handleNewStockAdjustment = (adjustment) => {
        const product = activeProducts.find(p => p.id === adjustment.product_id);
        if (product) {
            const newStockLevel = {
                productId: product.id,
                productName: product.name,
                stock: adjustment.new_quantity,
                timestamp: adjustment.created_at
            };
            setStockLevels(prev => {
                const updated = [...prev, newStockLevel].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - parseInt(selectedPeriod));
                return updated.filter(item => new Date(item.timestamp) >= cutoffDate);
            });
        }
    };
    const getStartDate = (period) => {
        const option = periodOptions.find(opt => opt.value === period);
        const startDate = new Date();
        if (period === 'today') {
            startDate.setHours(0, 0, 0, 0);
        }
        else if (period === 'yesterday') {
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
        }
        else if (option) {
            startDate.setDate(startDate.getDate() - option.days);
        }
        else {
            startDate.setDate(startDate.getDate() - 7); // default to a week
        }
        return startDate;
    };
    const fetchStockLevels = async () => {
        try {
            setLoading(true);
            setError(null);
            const endDate = new Date();
            const startDate = getStartDate(selectedPeriod);
            // First, get all products' current stock as the latest data point
            const currentLevels = activeProducts.map(product => ({
                productId: product.id,
                productName: product.name,
                stock: product.stock,
                timestamp: new Date().toISOString()
            }));
            // For "today" and "yesterday", we need to adjust the query to get more granular data
            const timeQuery = selectedPeriod === 'today' || selectedPeriod === 'yesterday'
                ? { ascending: true }
                : { ascending: true };
            // Then get historical adjustments
            const { data: adjustments, error } = await supabase
                .from('stock_adjustments')
                .select('product_id, new_quantity, created_at')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', timeQuery);
            if (error)
                throw error;
            // Combine current levels with historical adjustments
            let allLevels = [...currentLevels];
            if (adjustments) {
                const adjustmentLevels = adjustments.map(adj => {
                    const product = activeProducts.find(p => p.id === adj.product_id);
                    if (!product)
                        return null;
                    return {
                        productId: product.id,
                        productName: product.name,
                        stock: adj.new_quantity,
                        timestamp: adj.created_at
                    };
                }).filter((level) => level !== null);
                allLevels = [...adjustmentLevels, ...currentLevels];
            }
            // Group by appropriate time interval based on selected period
            const groupedLevels = allLevels.reduce((acc, level) => {
                let key;
                const date = new Date(level.timestamp);
                if (selectedPeriod === 'today' || selectedPeriod === 'yesterday') {
                    // Group by hour for today/yesterday
                    key = `${date.toISOString().split('T')[0]}-${date.getHours()}-${level.productId}`;
                }
                else {
                    // Group by day for other periods
                    key = `${date.toISOString().split('T')[0]}-${level.productId}`;
                }
                if (!acc[key] || new Date(level.timestamp) > new Date(acc[key].timestamp)) {
                    acc[key] = level;
                }
                return acc;
            }, {});
            const levels = Object.values(groupedLevels)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            setStockLevels(levels);
        }
        catch (error) {
            console.error('Error fetching stock levels:', error);
            setError('Failed to load inventory trends. Please try again later.');
        }
        finally {
            setLoading(false);
        }
    };
    const getProductColor = (productId, alpha = 1) => {
        const colors = [
            [255, 99, 132], // Red
            [54, 162, 235], // Blue
            [255, 206, 86], // Yellow
            [75, 192, 192], // Teal
            [153, 102, 255], // Purple
            [255, 159, 64], // Orange
            [52, 231, 43], // Green
            [250, 78, 121], // Pink
            [141, 99, 255], // Violet
            [255, 127, 80] // Coral
        ];
        const index = parseInt(productId.replace(/\D/g, '')) % colors.length;
        const [r, g, b] = colors[index] || colors[0];
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    const chartData = {
        labels: stockLevels
            .filter(level => level.productId === activeProducts[0]?.id) // Use first product's timestamps for labels
            .map(level => new Date(level.timestamp))
            .sort((a, b) => a.getTime() - b.getTime()),
        datasets: activeProducts.map(product => ({
            label: product.name,
            data: stockLevels
                .filter(level => level.productId === product.id)
                .map(level => level.stock)
                .sort((a, b) => a - b),
            backgroundColor: getProductColor(product.id, 0.8),
            borderColor: getProductColor(product.id, 1),
            borderWidth: 1,
            barThickness: 20,
            borderRadius: 4
        }))
    };
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    size: 14
                },
                bodyFont: {
                    size: 13
                },
                callbacks: {
                    label: (context) => {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ${value.toLocaleString()} units`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        size: 12
                    }
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        size: 12
                    },
                    callback: (value) => value.toLocaleString()
                }
            }
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Inventory Trends" }), _jsx("select", { value: selectedPeriod, onChange: (e) => setSelectedPeriod(e.target.value), className: "border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm", children: periodOptions.map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md", children: error })), _jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6 border border-gray-100", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Stock Levels" }), loading ? (_jsx("div", { className: "flex justify-center items-center h-[300px]", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" }) })) : stockLevels.length === 0 ? (_jsx("div", { className: "flex flex-col items-center justify-center h-[300px] text-gray-500", children: _jsx("p", { className: "text-sm", children: "No inventory data available for the selected period." }) })) : (_jsx("div", { className: "h-[300px]", children: _jsx(Bar, { data: chartData, options: chartOptions }) }))] })] }));
};
export default InventoryTrends;

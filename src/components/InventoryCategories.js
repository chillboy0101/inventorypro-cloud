import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);
const InventoryCategories = () => {
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const products = useSelector((state) => state.inventory.items);
    useEffect(() => {
        calculateCategoryData();
        // Subscribe to real-time product updates
        const subscription = supabase
            .channel('product-changes')
            .on('postgres_changes', {
            event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'products'
        }, () => {
            // Recalculate category data when products change
            calculateCategoryData();
        })
            .subscribe();
        return () => {
            subscription.unsubscribe();
        };
    }, [products]);
    const calculateCategoryData = () => {
        // Filter out ghost/deleted products
        const activeProducts = products.filter(product => !product.id.startsWith('GHOST-') &&
            !product.name.startsWith('[DELETED]') &&
            !product.sku.startsWith('DELETED-'));
        // If no active products, show empty chart
        if (activeProducts.length === 0) {
            setCategoryData([]);
            setLoading(false);
            return;
        }
        const categories = activeProducts.reduce((acc, product) => {
            const category = product.category || 'Other';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});
        const data = Object.entries(categories).map(([category, count]) => ({
            category,
            count
        }));
        setCategoryData(data);
        setLoading(false);
    };
    const chartData = {
        labels: categoryData.map(item => item.category),
        datasets: [
            {
                data: categoryData.map(item => item.count),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.9)', // Blue for Electronics
                    'rgba(16, 185, 129, 0.9)', // Green for Office Supplies
                    'rgba(245, 158, 11, 0.9)', // Orange for Furniture
                    'rgba(156, 163, 175, 0.9)', // Gray for Other
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(156, 163, 175, 1)',
                ],
                borderWidth: 1,
                hoverOffset: 4
            }
        ]
    };
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'right',
                align: 'center',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    },
                    generateLabels: (chart) => {
                        const data = chart.data;
                        if (data.labels?.length && data.datasets.length) {
                            return data.labels.map((label, i) => {
                                const value = data.datasets[0].data[i];
                                const total = data.datasets[0].data.reduce((acc, val) => acc + val, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                const backgroundColor = Array.isArray(data.datasets[0].backgroundColor)
                                    ? data.datasets[0].backgroundColor[i]
                                    : '';
                                const borderColor = Array.isArray(data.datasets[0].borderColor)
                                    ? data.datasets[0].borderColor[i]
                                    : '';
                                return {
                                    text: `${label} (${percentage}%)`,
                                    fillStyle: backgroundColor,
                                    strokeStyle: borderColor,
                                    lineWidth: 1,
                                    hidden: false,
                                    index: i,
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: 'white',
                bodyColor: 'white',
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: (context) => {
                        const value = context.raw;
                        const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${value} items (${percentage}%)`;
                    }
                }
            }
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Inventory Categories" }) }), loading ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" }) })) : (_jsx("div", { className: "h-[300px] p-6 bg-white rounded-xl shadow-sm border border-gray-100", children: _jsx(Doughnut, { data: chartData, options: chartOptions }) }))] }));
};
export default InventoryCategories;

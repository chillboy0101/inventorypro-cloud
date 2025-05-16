import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
import { ArrowUpIcon, ArrowDownIcon, ClockIcon, } from '@heroicons/react/24/outline';
const InventoryHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const products = useSelector((state) => state.inventory.items);
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data, error } = await supabase
                    .from('stock_adjustments')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);
                if (error)
                    throw error;
                // Map product names to the history items
                const historyWithProductNames = data.map(item => ({
                    ...item,
                    product_name: products.find(p => p.id === item.product_id)?.name || 'Unknown Product'
                }));
                setHistory(historyWithProductNames);
            }
            catch (error) {
                console.error('Error fetching history:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [products]);
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-32", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    return (_jsx("div", { className: "bg-white shadow rounded-lg", children: _jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Inventory History" }), _jsx("div", { className: "flow-root", children: _jsx("ul", { className: "-my-5 divide-y divide-gray-200", children: history.map((item) => (_jsx("li", { className: "py-4", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "flex-shrink-0", children: item.adjustment_type === 'in' ? (_jsx(ArrowUpIcon, { className: "h-6 w-6 text-green-500" })) : (_jsx(ArrowDownIcon, { className: "h-6 w-6 text-red-500" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: item.product_name }), _jsxs("p", { className: "text-sm text-gray-500", children: [item.adjustment_type === 'in' ? '+' : '-', item.quantity, " units"] }), _jsx("p", { className: "text-xs text-gray-400", children: item.reason })] }), _jsxs("div", { className: "flex items-center text-sm text-gray-500", children: [_jsx(ClockIcon, { className: "h-4 w-4 mr-1" }), new Date(item.created_at).toLocaleString()] })] }) }, item.id))) }) })] }) }));
};
export default InventoryHistory;

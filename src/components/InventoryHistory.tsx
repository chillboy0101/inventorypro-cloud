import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { supabase } from '../lib/supabase';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface HistoryItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  adjustment_type: 'in' | 'out';
  reason: string;
  previous_quantity: number;
  new_quantity: number;
  created_at: string;
}

const InventoryHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const products = useSelector((state: RootState) => state.inventory.items);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('stock_adjustments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Map product names to the history items
        const historyWithProductNames = data.map(item => ({
          ...item,
          product_name: products.find(p => p.id === item.product_id)?.name || 'Unknown Product'
        }));

        setHistory(historyWithProductNames);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [products]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Inventory History</h2>
        <div className="flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {history.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {item.adjustment_type === 'in' ? (
                      <ArrowUpIcon className="h-6 w-6 text-green-500" />
                    ) : (
                      <ArrowDownIcon className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.adjustment_type === 'in' ? '+' : '-'}{item.quantity} units
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.reason}
                    </p>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InventoryHistory; 
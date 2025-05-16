import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

interface RemoveSerialsModalProps {
  productId: string;
  onDone: () => void;
  onClose: () => void;
}

type SerialNumber = Database['public']['Tables']['serial_numbers']['Row'];

const RemoveSerialsModal: React.FC<RemoveSerialsModalProps> = ({ productId, onDone, onClose }) => {
  const [serials, setSerials] = useState<SerialNumber[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pasteInput, setPasteInput] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('serial_numbers')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'available');
      if (error) setError('Failed to load serial numbers');
      else setSerials(data || []);
    })();
  }, [productId]);

  const handleToggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (filteredSerials.every(sn => selected.includes(sn.id))) {
      setSelected(selected.filter(id => !filteredSerials.some(sn => sn.id === id)));
    } else {
      setSelected([...selected, ...filteredSerials.map(sn => sn.id).filter(id => !selected.includes(id))]);
    }
  };

  const handlePasteSerials = () => {
    const pasted = pasteInput
      .split(/\r?\n|,|;/)
      .map(s => s.trim())
      .filter(Boolean);
    const matching = serials.filter(sn => pasted.includes(sn.serial_number)).map(sn => sn.id);
    setSelected(prev => Array.from(new Set([...prev, ...matching])));
    setPasteInput('');
  };

  const handleRemove = async () => {
    if (selected.length === 0) {
      setError('Please select serial numbers to remove.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('serial_numbers')
        .update({ status: 'damaged' })
        .in('id', selected);
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      onDone();
    } catch (err) {
      console.error('Failed to remove serial numbers:', err);
      setError('Failed to remove serial numbers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSerials = serials.filter(sn => sn.serial_number.toLowerCase().includes(search.toLowerCase()));
  const allFilteredSelected = filteredSerials.length > 0 && filteredSerials.every(sn => selected.includes(sn.id));
  const selectionCount = selected.length;
  const availableCount = filteredSerials.length;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-2">Remove Serial Numbers</h3>
        <p className="mb-2 text-sm text-gray-600">Select serial number(s) to remove:</p>
        <div className="mb-2 sticky top-0 z-10 bg-white pb-2 flex flex-col gap-2 border-b border-gray-100">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search serials..."
              className="px-2 py-1 border rounded text-sm flex-1"
              aria-label="Search serials"
            />
            <input
              type="text"
              value={pasteInput}
              onChange={e => setPasteInput(e.target.value)}
              placeholder="Paste serials (comma, semicolon, or newline separated)..."
              className="px-2 py-1 border rounded text-xs flex-1"
              aria-label="Paste serials to select"
              title="Paste serial numbers separated by comma, semicolon, or newline."
            />
            <button
              type="button"
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
              onClick={handlePasteSerials}
              disabled={!pasteInput.trim()}
              title="Paste and select serials"
            >Paste & Select</button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Separate serials with comma, semicolon, or newline.
          </div>
          <div className="flex gap-2 items-center justify-between mt-1">
            <label className="flex items-center space-x-2" title="Select all filtered serials">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={handleSelectAll}
                disabled={filteredSerials.length === 0}
              />
              <span>Select All</span>
            </label>
            <span className="text-xs text-gray-600">{selectionCount} selected / {availableCount} shown</span>
          </div>
        </div>
        {error && <div className="mb-2 text-red-600">{error}</div>}
        <div className="mb-4 max-h-48 overflow-y-auto">
          {filteredSerials.map(sn => (
            <label key={sn.id} className="flex items-center space-x-2 mb-1">
              <input
                type="checkbox"
                value={sn.id}
                checked={selected.includes(sn.id)}
                onChange={() => handleToggle(sn.id)}
              />
              <span>{sn.serial_number}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
          <button
            onClick={handleRemove}
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={selected.length === 0 || loading}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveSerialsModal; 
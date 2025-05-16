import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
const RemoveSerialsModal = ({ productId, onDone, onClose }) => {
    const [serials, setSerials] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [pasteInput, setPasteInput] = useState('');
    useEffect(() => {
        (async () => {
            const { data, error } = await supabase
                .from('serial_numbers')
                .select('*')
                .eq('product_id', productId)
                .eq('status', 'available');
            if (error)
                setError('Failed to load serial numbers');
            else
                setSerials(data || []);
        })();
    }, [productId]);
    const handleToggle = (id) => {
        setSelected(prev => prev.includes(id)
            ? prev.filter(sid => sid !== id)
            : [...prev, id]);
    };
    const handleSelectAll = () => {
        if (filteredSerials.every(sn => selected.includes(sn.id))) {
            setSelected(selected.filter(id => !filteredSerials.some(sn => sn.id === id)));
        }
        else {
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
        }
        catch (err) {
            console.error('Failed to remove serial numbers:', err);
            setError('Failed to remove serial numbers');
        }
        finally {
            setLoading(false);
        }
    };
    const filteredSerials = serials.filter(sn => sn.serial_number.toLowerCase().includes(search.toLowerCase()));
    const allFilteredSelected = filteredSerials.length > 0 && filteredSerials.every(sn => selected.includes(sn.id));
    const selectionCount = selected.length;
    const availableCount = filteredSerials.length;
    return (_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-8 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto", children: [_jsx("h3", { className: "text-lg font-medium mb-2", children: "Remove Serial Numbers" }), _jsx("p", { className: "mb-2 text-sm text-gray-600", children: "Select serial number(s) to remove:" }), _jsxs("div", { className: "mb-2 sticky top-0 z-10 bg-white pb-2 flex flex-col gap-2 border-b border-gray-100", children: [_jsxs("div", { className: "flex gap-2 items-center", children: [_jsx("input", { type: "text", value: search, onChange: e => setSearch(e.target.value), placeholder: "Search serials...", className: "px-2 py-1 border rounded text-sm flex-1", "aria-label": "Search serials" }), _jsx("input", { type: "text", value: pasteInput, onChange: e => setPasteInput(e.target.value), placeholder: "Paste serials (comma, semicolon, or newline separated)...", className: "px-2 py-1 border rounded text-xs flex-1", "aria-label": "Paste serials to select", title: "Paste serial numbers separated by comma, semicolon, or newline." }), _jsx("button", { type: "button", className: "px-2 py-1 bg-blue-500 text-white rounded text-xs", onClick: handlePasteSerials, disabled: !pasteInput.trim(), title: "Paste and select serials", children: "Paste & Select" })] }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: "Separate serials with comma, semicolon, or newline." }), _jsxs("div", { className: "flex gap-2 items-center justify-between mt-1", children: [_jsxs("label", { className: "flex items-center space-x-2", title: "Select all filtered serials", children: [_jsx("input", { type: "checkbox", checked: allFilteredSelected, onChange: handleSelectAll, disabled: filteredSerials.length === 0 }), _jsx("span", { children: "Select All" })] }), _jsxs("span", { className: "text-xs text-gray-600", children: [selectionCount, " selected / ", availableCount, " shown"] })] })] }), error && _jsx("div", { className: "mb-2 text-red-600", children: error }), _jsx("div", { className: "mb-4 max-h-48 overflow-y-auto", children: filteredSerials.map(sn => (_jsxs("label", { className: "flex items-center space-x-2 mb-1", children: [_jsx("input", { type: "checkbox", value: sn.id, checked: selected.includes(sn.id), onChange: () => handleToggle(sn.id) }), _jsx("span", { children: sn.serial_number })] }, sn.id))) }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx("button", { onClick: onClose, className: "px-3 py-1 bg-gray-200 rounded", children: "Cancel" }), _jsx("button", { onClick: handleRemove, className: "px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50", disabled: selected.length === 0 || loading, children: "Confirm" })] })] }) }));
};
export default RemoveSerialsModal;

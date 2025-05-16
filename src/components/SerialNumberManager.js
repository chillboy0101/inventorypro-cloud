import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { QrCodeIcon } from '@heroicons/react/24/outline';
import { Html5Qrcode } from 'html5-qrcode';
const SerialNumberManager = ({ productId, onClose, initialCount, onOrderLinkClick }) => {
    const [serialNumbers, setSerialNumbers] = useState([]);
    const [newSerialNumber, setNewSerialNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [bulkSerials, setBulkSerials] = useState('');
    const [search, setSearch] = useState('');
    const [productStock, setProductStock] = useState(initialCount);
    const [scanSerial, setScanSerial] = useState('');
    const [scanMessage, setScanMessage] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [showAllSerials, setShowAllSerials] = useState(false);
    const videoRef = useRef(null);
    const filteredSerialNumbers = useMemo(() => {
        return serialNumbers
            .filter(sn => (showAllSerials ? true : sn.status === 'available'))
            .filter(sn => sn.serial_number.toLowerCase().includes(search.toLowerCase()) ||
            sn.status.toLowerCase().includes(search.toLowerCase()));
    }, [serialNumbers, search, showAllSerials]);
    useEffect(() => {
        fetchSerialNumbers();
    }, [productId]);
    useEffect(() => {
        if (typeof initialCount === 'number') {
            setProductStock(initialCount);
        }
        else {
            // Fetch product stock if not provided
            (async () => {
                const { data, error } = await supabase
                    .from('products')
                    .select('stock')
                    .eq('id', productId)
                    .single();
                if (!error && data)
                    setProductStock(data.stock);
            })();
        }
    }, [productId, initialCount]);
    // Camera scan handler
    useEffect(() => {
        let html5QrCode = null;
        if (showCamera && videoRef.current) {
            html5QrCode = new Html5Qrcode(videoRef.current.id);
            html5QrCode.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } }, (decodedText) => {
                setBulkSerials(prev => prev.trim() ? prev + '\n' + decodedText : decodedText);
                setShowCamera(false);
                html5QrCode && html5QrCode.stop();
            }, () => { });
        }
        return () => {
            if (html5QrCode)
                html5QrCode.stop().catch(() => { });
        };
    }, [showCamera]);
    const fetchSerialNumbers = async () => {
        try {
            const { data, error } = await supabase
                .from('serial_numbers')
                .select('*')
                .eq('product_id', productId)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            setSerialNumbers(data || []);
        }
        catch (err) {
            console.error('Error fetching serial numbers:', err);
            setError('Failed to load serial numbers');
        }
    };
    const getStockLimit = () => {
        return typeof productStock === 'number' ? productStock : undefined;
    };
    const handleBulkAdd = async () => {
        const serials = bulkSerials
            .split(/\r?\n|,|;/)
            .map(s => s.trim())
            .filter(Boolean);
        if (serials.length === 0)
            return;
        setIsLoading(true);
        setError(null);
        try {
            const inserts = serials.map(sn => ({
                id: crypto.randomUUID(),
                product_id: productId,
                serial_number: sn,
                status: 'available'
            }));
            const { error } = await supabase.from('serial_numbers').insert(inserts);
            if (error)
                throw error;
            setBulkSerials('');
            await fetchSerialNumbers();
        }
        catch (err) {
            setError('Failed to add serial numbers');
        }
        finally {
            setIsLoading(false);
        }
    };
    const availableSerialsCount = serialNumbers.filter(sn => sn.status === 'available').length;
    const stockLimit = getStockLimit() ?? 0;
    return (_jsxs("div", { className: "p-0 max-w-lg w-full bg-white rounded-xl shadow-2xl mx-auto flex flex-col relative", style: { maxHeight: '90vh', overflowY: 'auto' }, children: [_jsxs("div", { className: "flex justify-between items-center px-6 pt-6 pb-2 border-b border-gray-100 bg-white rounded-t-xl sticky top-0 z-20", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Manage Serial Numbers" }), _jsxs("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-500", children: [_jsx("span", { className: "sr-only", children: "Close" }), _jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })] })] }), (error || scanMessage) && (_jsx("div", { className: `mx-6 mt-4 mb-2 px-4 py-2 rounded text-sm font-medium ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-100'}`, children: error || scanMessage })), _jsx("div", { className: "mx-6 mt-2 mb-4 text-blue-700 font-semibold text-center text-base bg-blue-50 rounded py-2", children: `Available serials: ${availableSerialsCount}. Product stock: ${stockLimit}.` }), _jsxs("div", { className: "mx-6 mb-6 bg-gray-50 rounded-lg shadow-sm p-4 relative", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Enter or Scan Serial Numbers" }), _jsxs("div", { className: "relative", children: [_jsx("textarea", { value: bulkSerials, onChange: e => setBulkSerials(e.target.value), placeholder: "Paste, type, or scan serial numbers (one per line, or separated by comma/semicolon).", className: "w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10 mb-2 resize-y", rows: 3 }), _jsx("button", { type: "button", onClick: () => setShowCamera(true), className: "absolute top-2 right-2 p-2 rounded-full hover:bg-blue-100 focus:outline-none transition-colors", title: "Scan with Camera", style: { zIndex: 2 }, children: _jsx(QrCodeIcon, { className: "h-5 w-5 text-blue-600" }) })] }), _jsx("button", { onClick: handleBulkAdd, disabled: isLoading || !bulkSerials.trim(), className: "w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 mt-2", children: "Add Serial Numbers" })] }), _jsx("div", { className: "mx-6 border-t border-gray-200 mb-4" }), _jsxs("div", { className: "mx-6 mb-6 bg-white rounded-lg shadow-sm p-0 overflow-x-auto", style: { maxHeight: '32vh', overflowY: 'auto' }, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Serial Numbers" }), _jsxs("label", { className: "flex items-center gap-1 text-xs cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: showAllSerials, onChange: e => setShowAllSerials(e.target.checked) }), "Show all (incl. removed/damaged)"] })] }), _jsxs("table", { className: "min-w-full text-sm divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50 sticky top-0 z-10", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider", children: "Serial Number" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-100", children: filteredSerialNumbers.map((serial) => (_jsxs("tr", { children: [_jsxs("td", { className: "px-3 py-2 whitespace-nowrap text-gray-900 flex items-center gap-2", children: [serial.serial_number, _jsx(SerialAuditTrail, { serialId: serial.id, compact: true })] }), _jsx("td", { className: "px-3 py-2 whitespace-nowrap", children: _jsx("span", { className: `inline-block px-2 py-1 rounded text-xs font-semibold ${serial.status === 'available' ? 'bg-green-100 text-green-800' :
                                                    serial.status === 'allocated' ? 'bg-yellow-100 text-yellow-800' :
                                                        serial.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                                                            serial.status === 'returned' ? 'bg-purple-100 text-purple-800' :
                                                                serial.status === 'damaged' ? 'bg-red-100 text-red-800' :
                                                                    ''}`, children: serial.status.charAt(0).toUpperCase() + serial.status.slice(1) }) }), _jsx("td", { className: "px-3 py-2 whitespace-nowrap", children: serial.order_id ? (_jsxs("button", { className: "text-blue-600 underline cursor-pointer bg-transparent border-none p-0 text-xs", onClick: () => onOrderLinkClick && onOrderLinkClick(serial.order_id), children: ["Order: ", serial.order_id] })) : null })] }, serial.id))) })] })] }), _jsx("div", { className: "sticky bottom-0 left-0 w-full bg-white rounded-b-xl px-6 pb-6 pt-2 flex justify-end z-30 border-t border-gray-100", children: (() => {
                    const limit = getStockLimit() ?? 0;
                    const availableCount = serialNumbers.filter(sn => sn.status === 'available').length;
                    return (_jsx("button", { className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50", disabled: availableCount < limit, onClick: onClose, children: "Done" }));
                })() }), showCamera && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 flex flex-col items-center shadow-2xl relative", style: { minWidth: 340 }, children: [_jsxs("button", { onClick: () => setShowCamera(false), className: "absolute top-2 right-2 text-gray-400 hover:text-gray-600", children: [_jsx("span", { className: "sr-only", children: "Close" }), _jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })] }), _jsx("div", { className: "flex items-center justify-center", style: { width: 320, height: 320 }, children: _jsx("div", { id: "serial-scan-video", ref: videoRef, style: { width: 300, height: 300, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } }) })] }) })), isLoading && (_jsx("div", { className: "fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center z-50 rounded-xl", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-b-4 border-gray-200" }) }))] }));
};
const SerialAuditTrail = ({ serialId, compact }) => {
    const [history, setHistory] = useState([]);
    const [show, setShow] = useState(false);
    useEffect(() => {
        (async () => {
            const { data } = await supabase
                .from('serial_number_history')
                .select('*')
                .eq('serial_id', serialId)
                .order('timestamp', { ascending: false });
            setHistory(data || []);
        })();
    }, [serialId]);
    if (!history.length)
        return null;
    if (compact) {
        return (_jsxs(_Fragment, { children: [_jsx("button", { className: "ml-1 text-gray-400 hover:text-blue-600 focus:outline-none", title: "View serial history", onClick: e => { e.stopPropagation(); setShow(true); }, children: _jsx("svg", { className: "inline h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), show && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40", onClick: () => setShow(false), children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-4 max-w-xs w-full relative", onClick: e => e.stopPropagation(), children: [_jsx("button", { className: "absolute top-2 right-2 text-gray-400 hover:text-gray-600", onClick: () => setShow(false), children: _jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }), _jsx("div", { className: "font-semibold mb-2 text-gray-700 text-sm", children: "Serial Status History" }), _jsx("ul", { className: "text-xs text-gray-600 max-h-48 overflow-y-auto pr-2", children: history.map((h, i) => (_jsxs("li", { className: "mb-1", children: [_jsx("span", { className: "font-medium text-gray-800", children: h.status }), " at ", new Date(h.timestamp).toLocaleString(), h.order_id && _jsxs("span", { className: "text-blue-600", children: [" (Order: ", h.order_id, ")"] })] }, i))) })] }) }))] }));
    }
    // Default (non-compact) mode
    return (_jsxs("div", { className: "mt-1 text-xs text-gray-500", children: [_jsx("div", { children: "Status History:" }), _jsx("ul", { children: history.map((h, i) => (_jsxs("li", { children: [h.status, " at ", new Date(h.timestamp).toLocaleString(), h.order_id && ` (Order: ${h.order_id})`] }, i))) })] }));
};
export default SerialNumberManager;

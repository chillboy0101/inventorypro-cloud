import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateSettings } from '../store/slices/settingsSlice';
import { useNotificationDemo } from '../hooks/useNotificationDemo';
import { ChevronLeftIcon, MoonIcon, PhotoIcon, ArrowUpTrayIcon, BuildingOfficeIcon, QrCodeIcon, TagIcon, ExclamationTriangleIcon, FolderIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
const UserSettings = () => {
    const dispatch = useDispatch();
    const settings = useSelector((state) => state.settings);
    const navigate = useNavigate();
    const { showNotificationDemos } = useNotificationDemo();
    const [userName, setUserName] = useState(settings.userName || 'Demo User');
    const [email, setEmail] = useState(settings.userEmail || 'demo@example.com');
    const [darkMode, setDarkMode] = useState(settings.darkMode || false);
    const [currency, setCurrency] = useState(settings.currency || 'USD');
    const [notifications, setNotifications] = useState(settings.notifications || false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [profileImage, setProfileImage] = useState(settings.profileImage || '');
    const [isHovering, setIsHovering] = useState(false);
    const [companyName, setCompanyName] = useState(settings.companyName || 'InventoryPro');
    // Inventory settings
    const [lowStockThreshold, setLowStockThreshold] = useState(settings.lowStockThreshold || 5);
    const [defaultCategory, setDefaultCategory] = useState(settings.defaultCategory || 'General');
    const [autoGenerateSKU, setAutoGenerateSKU] = useState(settings.autoGenerateSKU === false ? false : true);
    const [enableBarcodeScanning, setEnableBarcodeScanning] = useState(settings.enableBarcodeScanning === false ? false : true);
    const [valuationMethod, setValuationMethod] = useState(settings.valuationMethod || 'FIFO');
    // Valuation methods with descriptions
    const valuationMethods = [
        {
            value: 'FIFO',
            name: 'FIFO (First In, First Out)',
            description: 'Assumes that items purchased first are sold first. Cost of inventory reflects most recent purchases.'
        },
        {
            value: 'LIFO',
            name: 'LIFO (Last In, First Out)',
            description: 'Assumes that items purchased most recently are sold first. Cost of inventory reflects oldest purchases.'
        },
        {
            value: 'Average Cost',
            name: 'Average Cost (Weighted Average)',
            description: 'Uses the weighted average of all units available for sale to assign cost to both COGS and ending inventory.'
        },
        {
            value: 'Specific Identification',
            name: 'Specific Identification',
            description: 'Tracks the cost of each individual item in inventory. Most precise method, but requires detailed tracking.'
        }
    ];
    // Sample categories for dropdown
    const categories = [
        'General',
        'Electronics',
        'Clothing',
        'Office Supplies',
        'Furniture',
        'Food & Beverages',
        'Books',
        'Tools',
        'Health & Beauty',
        'Toys & Games',
        'Sports Equipment',
        'Raw Materials',
        'Automotive',
        'Pet Supplies'
    ];
    const fileInputRef = useRef(null);
    // List of available currencies - comprehensive global list
    const currencies = [
        { code: 'USD', name: 'US Dollar ($)' },
        { code: 'EUR', name: 'Euro (€)' },
        { code: 'GBP', name: 'British Pound (£)' },
        { code: 'JPY', name: 'Japanese Yen (¥)' },
        { code: 'CAD', name: 'Canadian Dollar (C$)' },
        { code: 'AUD', name: 'Australian Dollar (A$)' },
        { code: 'GHS', name: 'Ghana Cedis (₵)' },
        { code: 'AED', name: 'UAE Dirham (د.إ)' },
        { code: 'AFN', name: 'Afghan Afghani (؋)' },
        { code: 'ALL', name: 'Albanian Lek (L)' },
        { code: 'AMD', name: 'Armenian Dram (֏)' },
        { code: 'ANG', name: 'Netherlands Antillean Guilder (ƒ)' },
        { code: 'AOA', name: 'Angolan Kwanza (Kz)' },
        { code: 'ARS', name: 'Argentine Peso ($)' },
        { code: 'AWG', name: 'Aruban Florin (ƒ)' },
        { code: 'AZN', name: 'Azerbaijani Manat (₼)' },
        { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark (KM)' },
        { code: 'BBD', name: 'Barbadian Dollar ($)' },
        { code: 'BDT', name: 'Bangladeshi Taka (৳)' },
        { code: 'BGN', name: 'Bulgarian Lev (лв)' },
        { code: 'BHD', name: 'Bahraini Dinar (.د.ب)' },
        { code: 'BIF', name: 'Burundian Franc (FBu)' },
        { code: 'BMD', name: 'Bermudan Dollar ($)' },
        { code: 'BND', name: 'Brunei Dollar ($)' },
        { code: 'BOB', name: 'Bolivian Boliviano (Bs.)' },
        { code: 'BRL', name: 'Brazilian Real (R$)' },
        { code: 'BSD', name: 'Bahamian Dollar ($)' },
        { code: 'BTN', name: 'Bhutanese Ngultrum (Nu.)' },
        { code: 'BWP', name: 'Botswanan Pula (P)' },
        { code: 'BYN', name: 'Belarusian Ruble (Br)' },
        { code: 'BZD', name: 'Belize Dollar (BZ$)' },
        { code: 'CNY', name: 'Chinese Yuan (¥)' },
        { code: 'INR', name: 'Indian Rupee (₹)' },
        { code: 'NGN', name: 'Nigerian Naira (₦)' },
        { code: 'ZAR', name: 'South African Rand (R)' },
    ];
    // Navigate back to the previous page
    const goBack = () => {
        navigate(-1);
    };
    // Handle profile image upload
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }
        // Check if file size is less than 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert('File size should be less than 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setProfileImage(event.target.result);
            }
        };
        reader.readAsDataURL(file);
    };
    // Trigger file input click
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };
    const removeProfileImage = () => {
        setProfileImage('');
    };
    // Form submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        // Update settings in Redux
        dispatch(updateSettings({
            userName,
            userEmail: email,
            darkMode,
            currency,
            notifications,
            profileImage,
            companyName,
            lowStockThreshold,
            defaultCategory,
            autoGenerateSKU,
            enableBarcodeScanning,
            valuationMethod
        }));
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));
        setIsSaving(false);
        setSaveSuccess(true);
        // Show demo notifications if enabled
        if (notifications) {
            showNotificationDemos();
        }
        // Hide success message after 3 seconds
        setTimeout(() => {
            setSaveSuccess(false);
        }, 3000);
    };
    return (_jsxs("div", { className: `max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${settings.darkMode ? 'text-gray-100' : ''}`, children: [_jsxs("div", { className: "mb-8 flex items-center", children: [_jsx("button", { onClick: goBack, className: `mr-3 p-1 rounded-full ${settings.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`, children: _jsx(ChevronLeftIcon, { className: "h-6 w-6" }) }), _jsx("h1", { className: "text-2xl font-bold", children: "User Profile Settings" })] }), saveSuccess && (_jsx("div", { className: "mb-6 bg-green-50 dark:bg-green-900/30 border dark:border-green-900 border-green-200 text-green-800 dark:text-green-300 px-4 py-3 rounded-md", children: "Settings saved successfully!" })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-8", children: [_jsxs("div", { className: `p-6 rounded-xl border ${settings.darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'} settings-card`, children: [_jsx("h2", { className: "text-lg font-medium mb-6 pb-3 border-b border-gray-200 dark:border-gray-700", children: "Company Information" }), _jsxs("div", { className: "flex items-center mb-4", children: [_jsx("div", { className: `w-10 h-10 rounded-md flex items-center justify-center mr-3 ${settings.darkMode ? 'bg-blue-900/20' : 'bg-blue-100'}`, children: _jsx(BuildingOfficeIcon, { className: "h-6 w-6 text-blue-500" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { htmlFor: "companyName", className: "block text-sm font-medium", children: "Company Name" }), _jsx("input", { id: "companyName", type: "text", value: companyName, onChange: (e) => setCompanyName(e.target.value), className: `mt-1 block w-full rounded-md shadow-sm sm:text-sm ${settings.darkMode
                                                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`, placeholder: "Enter your company name" }), _jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: "This name will be displayed throughout the application and on generated reports." })] })] })] }), _jsxs("div", { className: `p-6 rounded-xl border ${settings.darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'} settings-card`, children: [_jsx("h2", { className: "text-lg font-medium mb-6 pb-3 border-b border-gray-200 dark:border-gray-700", children: "User Information" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-6", children: [_jsx("div", { className: "flex justify-center sm:block", children: _jsxs("div", { className: "relative", onMouseEnter: () => setIsHovering(true), onMouseLeave: () => setIsHovering(false), children: [profileImage ? (_jsxs("div", { className: "w-24 h-24 rounded-full overflow-hidden relative", children: [_jsx("img", { src: profileImage, alt: "Profile", className: "w-full h-full object-cover" }), isHovering && (_jsxs("div", { className: "absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white", children: [_jsxs("button", { type: "button", className: "text-xs font-medium mb-1", onClick: triggerFileInput, children: [_jsx(ArrowUpTrayIcon, { className: "h-4 w-4 mx-auto mb-1" }), "Change"] }), _jsx("button", { type: "button", className: "text-xs font-medium text-red-300 hover:text-red-200", onClick: removeProfileImage, children: "Remove" })] }))] })) : (_jsxs("div", { onClick: triggerFileInput, className: `w-24 h-24 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${settings.darkMode
                                                        ? 'bg-blue-900/20 hover:bg-blue-800/30'
                                                        : 'bg-blue-100 hover:bg-blue-200'}`, children: [_jsx(PhotoIcon, { className: "h-10 w-10 text-blue-500 mb-1" }), _jsx("span", { className: "text-xs text-blue-600 dark:text-blue-400 font-medium", children: "Add Photo" })] })), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleImageUpload, className: "hidden" })] }) }), _jsxs("div", { className: "flex-1 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium", children: "Name" }), _jsx("input", { id: "name", type: "text", value: userName, onChange: (e) => setUserName(e.target.value), className: `mt-1 block w-full rounded-md shadow-sm sm:text-sm ${settings.darkMode
                                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}` })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium", children: "Email" }), _jsx("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: `mt-1 block w-full rounded-md shadow-sm sm:text-sm ${settings.darkMode
                                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}` })] })] })] })] }), _jsxs("div", { className: `p-6 rounded-xl border ${settings.darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'} settings-card`, children: [_jsx("h2", { className: "text-lg font-medium mb-6 pb-3 border-b border-gray-200 dark:border-gray-700", children: "Inventory Settings" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: `w-10 h-10 rounded-md flex items-center justify-center mr-3 mt-1 ${settings.darkMode ? 'bg-indigo-900/20' : 'bg-indigo-100'}`, children: _jsx(CalculatorIcon, { className: "h-6 w-6 text-indigo-500" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { htmlFor: "valuationMethod", className: "block text-sm font-medium", children: "Inventory Valuation Method" }), _jsx("select", { id: "valuationMethod", value: valuationMethod, onChange: (e) => setValuationMethod(e.target.value), className: `mt-1 block w-full max-w-lg rounded-md shadow-sm sm:text-sm ${settings.darkMode
                                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-500 focus:border-indigo-500'
                                                            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`, children: valuationMethods.map((method) => (_jsx("option", { value: method.value, children: method.name }, method.value))) }), valuationMethod && (_jsxs("div", { className: `mt-2 p-3 rounded-md text-xs ${settings.darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`, children: [_jsxs("p", { className: "font-medium mb-1", children: [valuationMethods.find(m => m.value === valuationMethod)?.name, ":"] }), _jsx("p", { children: valuationMethods.find(m => m.value === valuationMethod)?.description })] })), _jsx("p", { className: "mt-3 text-xs text-gray-500 dark:text-gray-400", children: "This method determines how inventory costs are calculated for accounting and reporting." })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: `w-10 h-10 rounded-md flex items-center justify-center mr-3 mt-1 ${settings.darkMode ? 'bg-amber-900/20' : 'bg-amber-100'}`, children: _jsx(ExclamationTriangleIcon, { className: "h-6 w-6 text-amber-500" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { htmlFor: "lowStockThreshold", className: "block text-sm font-medium", children: "Low Stock Threshold" }), _jsx("input", { id: "lowStockThreshold", type: "number", min: "0", value: lowStockThreshold, onChange: (e) => setLowStockThreshold(Number(e.target.value)), className: `mt-1 block w-full max-w-xs rounded-md shadow-sm sm:text-sm ${settings.darkMode
                                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}` }), _jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: "Items with quantity less than this value will trigger low stock warnings." })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: `w-10 h-10 rounded-md flex items-center justify-center mr-3 mt-1 ${settings.darkMode ? 'bg-blue-900/20' : 'bg-blue-100'}`, children: _jsx(FolderIcon, { className: "h-6 w-6 text-blue-500" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { htmlFor: "defaultCategory", className: "block text-sm font-medium", children: "Default Category" }), _jsx("select", { id: "defaultCategory", value: defaultCategory, onChange: (e) => setDefaultCategory(e.target.value), className: `mt-1 block w-full max-w-xs rounded-md shadow-sm sm:text-sm ${settings.darkMode
                                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`, children: categories.map((category) => (_jsx("option", { value: category, children: category }, category))) }), _jsx("p", { className: "mt-1 text-xs text-gray-500 dark:text-gray-400", children: "The default category assigned to new inventory items." })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: `w-10 h-10 rounded-md flex items-center justify-center mr-3 mt-1 ${settings.darkMode ? 'bg-purple-900/20' : 'bg-purple-100'}`, children: _jsx(TagIcon, { className: "h-6 w-6 text-purple-500" }) }), _jsx("div", { className: "flex-1", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "autoGenerateSKU", className: "text-sm font-medium", children: "Auto-Generate SKU" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Automatically generate SKU codes for new products" })] }), _jsxs("div", { className: "relative inline-block w-12 h-6 ml-2", children: [_jsx("input", { type: "checkbox", id: "autoGenerateSKU", checked: autoGenerateSKU, onChange: (e) => setAutoGenerateSKU(e.target.checked), className: "sr-only" // Hidden but accessible checkbox
                                                                 }), _jsx("label", { htmlFor: "autoGenerateSKU", className: `absolute cursor-pointer inset-0 rounded-full transition-colors duration-200 ease-in-out toggle-bg ${autoGenerateSKU ? 'bg-purple-600 toggle-active' : 'bg-gray-200'}`, children: _jsx("span", { className: `absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${autoGenerateSKU ? 'transform translate-x-6' : ''}` }) })] })] }) })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: `w-10 h-10 rounded-md flex items-center justify-center mr-3 mt-1 ${settings.darkMode ? 'bg-green-900/20' : 'bg-green-100'}`, children: _jsx(QrCodeIcon, { className: "h-6 w-6 text-green-500" }) }), _jsx("div", { className: "flex-1", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "enableBarcodeScanning", className: "text-sm font-medium", children: "Barcode Scanning" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Enable barcode/QR code scanning for faster inventory management" })] }), _jsxs("div", { className: "relative inline-block w-12 h-6 ml-2", children: [_jsx("input", { type: "checkbox", id: "enableBarcodeScanning", checked: enableBarcodeScanning, onChange: (e) => setEnableBarcodeScanning(e.target.checked), className: "sr-only" // Hidden but accessible checkbox
                                                                 }), _jsx("label", { htmlFor: "enableBarcodeScanning", className: `absolute cursor-pointer inset-0 rounded-full transition-colors duration-200 ease-in-out toggle-bg ${enableBarcodeScanning ? 'bg-green-600 toggle-active' : 'bg-gray-200'}`, children: _jsx("span", { className: `absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${enableBarcodeScanning ? 'transform translate-x-6' : ''}` }) })] })] }) })] })] })] }), _jsxs("div", { className: `p-6 rounded-xl border ${settings.darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'} settings-card`, children: [_jsx("h2", { className: "text-lg font-medium mb-6 pb-3 border-b border-gray-200 dark:border-gray-700", children: "Preferences" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "darkMode", className: "text-sm font-medium", children: "Dark Mode" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Enable dark mode for the application" })] }), _jsxs("div", { className: "relative inline-block w-12 h-6 ml-2", children: [_jsx("input", { type: "checkbox", id: "darkMode", checked: darkMode, onChange: (e) => setDarkMode(e.target.checked), className: "sr-only" // Hidden but accessible checkbox
                                                     }), _jsx("label", { htmlFor: "darkMode", className: `absolute cursor-pointer inset-0 rounded-full transition-colors duration-200 ease-in-out toggle-bg ${darkMode ? 'bg-blue-600 toggle-active' : 'bg-gray-200'}`, children: _jsx("span", { className: `absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${darkMode ? 'transform translate-x-6' : ''}` }) })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "currency", className: "block text-sm font-medium", children: "Currency" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Select your preferred currency for displaying monetary values" }), _jsx("select", { id: "currency", value: currency, onChange: (e) => setCurrency(e.target.value), className: `mt-1 block w-full rounded-md shadow-sm sm:text-sm ${settings.darkMode
                                                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`, children: currencies.map((option) => (_jsx("option", { value: option.code, children: option.name }, option.code))) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "notifications", className: "text-sm font-medium", children: "Email Notifications" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Receive email notifications about low stock, order updates, and important changes" }), notifications && email && (_jsxs("p", { className: "text-xs text-blue-600 dark:text-blue-400 mt-1", children: ["Notifications will be sent to: ", email] }))] }), _jsxs("div", { className: "relative inline-block w-12 h-6 ml-2", children: [_jsx("input", { type: "checkbox", id: "notifications", checked: notifications, onChange: (e) => setNotifications(e.target.checked), className: "sr-only" // Hidden but accessible checkbox
                                                     }), _jsx("label", { htmlFor: "notifications", className: `absolute cursor-pointer inset-0 rounded-full transition-colors duration-200 ease-in-out toggle-bg ${notifications ? 'bg-blue-600 toggle-active' : 'bg-gray-200'}`, children: _jsx("span", { className: `absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${notifications ? 'transform translate-x-6' : ''}` }) })] })] })] })] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: goBack, className: `px-4 py-2 border shadow-sm text-sm font-medium rounded-md ${settings.darkMode
                                    ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`, children: "Cancel" }), _jsx("button", { type: "submit", disabled: isSaving, className: "inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: isSaving ? 'Saving...' : 'Save Settings' })] }), darkMode && (_jsxs("div", { className: "mt-6 p-6 rounded-xl bg-gray-800 border border-gray-700 text-white shadow-lg", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center", children: _jsx(MoonIcon, { className: "h-6 w-6 text-blue-400" }) }), _jsx("h3", { className: "text-lg font-medium", children: "Dark Mode Preview" })] }), _jsx("p", { className: "text-sm text-gray-300 mb-4", children: "This is how elements will appear in dark mode. The full effect will be applied when you save settings." }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-3 rounded-lg bg-gray-700 border border-gray-600", children: [_jsx("div", { className: "text-sm font-medium mb-2", children: "Sample Card" }), _jsx("div", { className: "h-2 bg-gray-600 rounded-full w-3/4 mb-2" }), _jsx("div", { className: "h-2 bg-gray-600 rounded-full w-1/2" })] }), _jsxs("div", { className: "p-3 rounded-lg bg-gray-700 border border-gray-600", children: [_jsx("div", { className: "text-sm font-medium mb-2", children: "Sample Button" }), _jsx("button", { className: "px-3 py-1 bg-blue-600 text-white text-xs rounded-md", children: "Button" })] })] })] }))] })] }));
};
export default UserSettings;

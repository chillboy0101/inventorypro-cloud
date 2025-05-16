import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { applyTheme } from '../utils/themeUtils';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from '../contexts/AuthContext';
import Notifications from './Notifications';
import { HomeIcon, CubeIcon, ShoppingCartIcon, BuildingStorefrontIcon, ChartBarIcon, CubeTransparentIcon, ArrowUpTrayIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon, BellIcon } from '@heroicons/react/24/outline';
const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Products', href: '/products', icon: CubeIcon },
    { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
    { name: 'Inventory', href: '/inventory', icon: BuildingStorefrontIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    { name: 'Import CSV', href: '/import', icon: ArrowUpTrayIcon },
];
const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const settings = useSelector((state) => state.settings);
    const { companyName } = useAppSettings();
    const { logout } = useAuth();
    // Apply dark mode effect when settings change
    useEffect(() => {
        applyTheme(settings.darkMode || false);
    }, [settings.darkMode]);
    const handleLogout = async () => {
        try {
            await logout();
            // The AuthContext will handle the session cleanup and redirect
        }
        catch (error) {
            console.error('Failed to logout:', error);
        }
    };
    const handleUserSettings = () => {
        navigate('/settings');
    };
    return (_jsxs("div", { className: `min-h-screen ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`, children: [_jsx(Notifications, {}), _jsxs("div", { className: `fixed inset-y-0 left-0 w-64 ${settings.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r`, children: [_jsx("div", { className: "flex items-center h-16 px-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(CubeTransparentIcon, { className: "h-8 w-8 text-blue-600" }), _jsx("span", { className: "ml-2 text-xl font-semibold text-blue-600", children: companyName })] }) }), _jsx("nav", { className: "mt-5 px-4 space-y-1", children: navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (_jsxs(Link, { to: item.href, className: `
                  group flex items-center px-4 py-3 text-sm font-medium rounded-lg
                  transition-colors duration-150 ease-in-out
                  ${isActive
                                    ? `${settings.darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-600'}`
                                    : `${settings.darkMode
                                        ? 'text-gray-300 hover:bg-blue-900 hover:text-blue-200'
                                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                `, children: [_jsx(item.icon, { className: `
                    mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-150 ease-in-out
                    ${isActive
                                            ? `${settings.darkMode ? 'text-blue-300' : 'text-blue-600'}`
                                            : `${settings.darkMode
                                                ? 'text-gray-400 group-hover:text-blue-300'
                                                : 'text-gray-400 group-hover:text-blue-600'}`}
                  `, "aria-hidden": "true" }), item.name] }, item.name));
                        }) }), _jsx("div", { className: `absolute bottom-0 left-0 right-0 p-4 border-t ${settings.darkMode ? 'border-gray-700' : 'border-gray-200'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center", children: _jsx("span", { className: "text-blue-600 text-sm font-medium", children: settings.userName ? settings.userName.charAt(0) : 'U' }) }), _jsx("div", { className: "ml-3", children: _jsx("p", { className: `text-sm font-medium ${settings.darkMode ? 'text-white' : 'text-gray-700'}`, children: settings.userName || 'Demo User' }) })] }), _jsxs("div", { className: "flex space-x-2", children: [settings.notifications && (_jsx("button", { className: `p-2 rounded-lg transition-colors duration-150 ease-in-out ${settings.darkMode
                                                ? 'text-gray-400 hover:text-blue-300 hover:bg-blue-900'
                                                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`, title: "Notifications", children: _jsx(BellIcon, { className: "h-5 w-5" }) })), _jsx("button", { onClick: handleUserSettings, className: `p-2 rounded-lg transition-colors duration-150 ease-in-out ${settings.darkMode
                                                ? 'text-gray-400 hover:text-blue-300 hover:bg-blue-900'
                                                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`, title: "User Settings", children: _jsx(Cog6ToothIcon, { className: "h-5 w-5" }) }), _jsx("button", { onClick: handleLogout, className: `p-2 rounded-lg transition-colors duration-150 ease-in-out ${settings.darkMode
                                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-900'
                                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`, title: "Logout", children: _jsx(ArrowRightOnRectangleIcon, { className: "h-5 w-5" }) })] })] }) })] }), _jsx("div", { className: `pl-64 ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} min-h-screen`, children: _jsx("main", { className: `py-6 ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`, children: _jsx("div", { className: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`, children: _jsx(Outlet, {}) }) }) })] }));
};
export default Layout;

import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { applyTheme } from '../utils/themeUtils';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from '../contexts/AuthContext';
import Notifications from './Notifications';
import {
  HomeIcon,
  CubeIcon,
  ShoppingCartIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  CubeTransparentIcon,
  ArrowUpTrayIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Products', href: '/products', icon: CubeIcon },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
  { name: 'Inventory', href: '/inventory', icon: BuildingStorefrontIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Import CSV', href: '/import', icon: ArrowUpTrayIcon },
];

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const settings = useSelector((state: RootState) => state.settings);
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
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleUserSettings = () => {
    navigate('/settings');
  };

  return (
    <div className={`min-h-screen ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Notification System */}
      <Notifications />
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 ${settings.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r`}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4">
          <div className="flex items-center">
            <CubeTransparentIcon className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-blue-600">{companyName}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-5 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-4 py-3 text-sm font-medium rounded-lg
                  transition-colors duration-150 ease-in-out
                  ${isActive
                    ? `${settings.darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-600'}`
                    : `${settings.darkMode 
                        ? 'text-gray-300 hover:bg-blue-900 hover:text-blue-200' 
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-150 ease-in-out
                    ${isActive
                      ? `${settings.darkMode ? 'text-blue-300' : 'text-blue-600'}`
                      : `${settings.darkMode 
                          ? 'text-gray-400 group-hover:text-blue-300'
                          : 'text-gray-400 group-hover:text-blue-600'}`
                    }
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info and Logout */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${settings.darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">
                  {settings.userName ? settings.userName.charAt(0) : 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${settings.darkMode ? 'text-white' : 'text-gray-700'}`}>
                  {settings.userName || 'Demo User'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {settings.notifications && (
                <button
                  className={`p-2 rounded-lg transition-colors duration-150 ease-in-out ${
                    settings.darkMode 
                      ? 'text-gray-400 hover:text-blue-300 hover:bg-blue-900' 
                      : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title="Notifications"
                >
                  <BellIcon className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={handleUserSettings}
                className={`p-2 rounded-lg transition-colors duration-150 ease-in-out ${
                  settings.darkMode 
                    ? 'text-gray-400 hover:text-blue-300 hover:bg-blue-900' 
                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="User Settings"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-colors duration-150 ease-in-out ${
                  settings.darkMode 
                    ? 'text-gray-400 hover:text-red-600 hover:bg-red-900' 
                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                }`}
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`pl-64 ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} min-h-screen`}>
        <main className={`py-6 ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
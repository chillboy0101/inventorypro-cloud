import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../views/Dashboard';
import Products from '../views/Products';
import Orders from '../views/Orders';
import Inventory from '../views/Inventory';
import Reports from '../views/Reports';
import ImportCSV from '../views/ImportCSV';
import UserSettings from '../views/UserSettings';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import TermsOfService from '../pages/TermsOfService';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import ForgotPassword from '../pages/ForgotPassword';
import VerificationSuccess from '../pages/VerificationSuccess';
import PrivateRoute from '../components/PrivateRoute';

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Error caught by boundary:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">We're sorry, but there was an error loading this page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/terms-of-service',
    element: <TermsOfService />,
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicy />,
  },
  {
    path: '/auth/callback',
    element: <VerificationSuccess />,
  },
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'products',
        element: <Products />,
      },
      {
        path: 'import',
        element: <ImportCSV />,
      },
      {
        path: 'orders',
        element: <Orders />,
      },
      {
        path: 'inventory',
        element: <Inventory />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'settings',
        element: <UserSettings />,
      },
      {
        path: 'add-product',
        element: <Navigate to="/products" replace />,
      },
      {
        path: 'stock-adjustments',
        element: <Navigate to="/inventory" replace />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]); 
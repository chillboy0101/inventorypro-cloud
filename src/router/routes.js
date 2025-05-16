import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
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
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import AuthCallback from '../pages/AuthCallback';
import PrivateRoute from '../components/PrivateRoute';
import PublicOnlyRoute from '../components/PublicOnlyRoute';
import ResetPasswordRoute from '../components/ResetPasswordRoute';
import ErrorBoundary from '../components/ErrorBoundary';
import TermsOfService from '../pages/TermsOfService';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import EmailTest from '../pages/EmailTest';
export const routes = [
    {
        path: '/auth/callback',
        element: _jsx(AuthCallback, {}),
    },
    {
        path: '/',
        element: (_jsx(ErrorBoundary, { children: _jsx(PrivateRoute, { children: _jsx(Layout, {}) }) })),
        children: [
            {
                index: true,
                element: _jsx(Dashboard, {}),
            },
            {
                path: 'products',
                element: _jsx(Products, {}),
            },
            {
                path: 'import',
                element: _jsx(ImportCSV, {}),
            },
            {
                path: 'orders',
                element: _jsx(Orders, {}),
            },
            {
                path: 'inventory',
                element: _jsx(Inventory, {}),
            },
            {
                path: 'reports',
                element: _jsx(Reports, {}),
            },
            {
                path: 'settings',
                element: _jsx(UserSettings, {}),
            },
            // Catch-all route for the authenticated section
            {
                path: '*',
                element: _jsx(Navigate, { to: "/", replace: true }),
            },
        ],
    },
    {
        path: '/login',
        element: (_jsx(PublicOnlyRoute, { children: _jsx(Login, {}) })),
    },
    {
        path: '/signup',
        element: (_jsx(PublicOnlyRoute, { children: _jsx(Signup, {}) })),
    },
    {
        path: '/forgot-password',
        element: (_jsx(PublicOnlyRoute, { children: _jsx(ForgotPassword, {}) })),
    },
    {
        path: '/reset-password',
        element: (_jsx(ResetPasswordRoute, { children: _jsx(ResetPassword, {}) })),
    },
    {
        path: '/auth/reset-password',
        element: (_jsx(ResetPasswordRoute, { children: _jsx(ResetPassword, {}) })),
    },
    {
        path: '/terms-of-service',
        element: _jsx(TermsOfService, {}),
    },
    {
        path: '/privacy-policy',
        element: _jsx(PrivacyPolicy, {}),
    },
    {
        path: '/email-test',
        element: _jsx(EmailTest, {}),
    },
];

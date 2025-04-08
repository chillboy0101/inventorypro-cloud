import React from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
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

export const routes: RouteObject[] = [
  {
    path: '/auth/callback',
    element: <AuthCallback />,
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
      // Catch-all route for the authenticated section
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <Login />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicOnlyRoute>
        <Signup />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicOnlyRoute>
        <ForgotPassword />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <ResetPasswordRoute>
        <ResetPassword />
      </ResetPasswordRoute>
    ),
  },
  {
    path: '/auth/reset-password',
    element: (
      <ResetPasswordRoute>
        <ResetPassword />
      </ResetPasswordRoute>
    ),
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
    path: '/email-test',
    element: <EmailTest />,
  },
]; 
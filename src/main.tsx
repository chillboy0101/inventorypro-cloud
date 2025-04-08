import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store';
import { router } from './router';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { applyTheme } from './utils/themeUtils';
import './index.css';
import { checkEmailConfig } from './lib/email-test';

// Initialize theme based on saved settings
try {
  const savedSettings = localStorage.getItem('inventorySettings');
  if (savedSettings) {
    const { darkMode } = JSON.parse(savedSettings);
    applyTheme(darkMode || false);
  }
} catch (error) {
  console.error('Error initializing theme:', error);
}

// Check email configuration on startup
const emailConfigStatus = checkEmailConfig();
console.log('[App] Supabase configuration status:', emailConfigStatus.message);
console.log('[App] Using Supabase email service for verification and password reset');

// Add more detailed debug information about the environment
console.log('[App] Environment:', import.meta.env.MODE);
console.log('[App] Supabase URL configured:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('[App] Site URL:', window.location.origin);

// Log the redirect URL for auth flows
console.log('[App] Auth redirect URL:', `${window.location.origin}/auth/callback`);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);
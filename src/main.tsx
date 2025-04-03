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
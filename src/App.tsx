import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Inventory from './views/Inventory';
import Orders from './views/Orders';
import Products from './views/Products';
import Reports from './views/Reports';
import ImportCSV from './views/ImportCSV';
import AddProduct from './views/AddProduct';
import StockAdjustments from './views/StockAdjustments';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="orders" element={<Orders />} />
        <Route path="products" element={<Products />} />
        <Route path="reports" element={<Reports />} />
        <Route path="import" element={<ImportCSV />} />
        <Route path="add-product" element={<AddProduct />} />
        <Route path="stock-adjustments" element={<StockAdjustments />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App; 
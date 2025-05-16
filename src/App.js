import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsxs(Route, { path: "/", element: _jsx(Layout, {}), children: [_jsx(Route, { index: true, element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "inventory", element: _jsx(Inventory, {}) }), _jsx(Route, { path: "orders", element: _jsx(Orders, {}) }), _jsx(Route, { path: "products", element: _jsx(Products, {}) }), _jsx(Route, { path: "reports", element: _jsx(Reports, {}) }), _jsx(Route, { path: "import", element: _jsx(ImportCSV, {}) }), _jsx(Route, { path: "add-product", element: _jsx(AddProduct, {}) }), _jsx(Route, { path: "stock-adjustments", element: _jsx(StockAdjustments, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
export default App;

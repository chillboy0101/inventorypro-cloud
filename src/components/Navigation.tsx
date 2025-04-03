import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  CubeIcon,
  ChartBarIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Inventory', href: '/inventory', icon: ClipboardDocumentListIcon },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
  { name: 'Products', href: '/products', icon: CubeIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Import CSV', href: '/import', icon: ArrowUpTrayIcon },
  { name: 'Add Product', href: '/add-product', icon: PlusIcon },
  { name: 'Stock Adjustments', href: '/stock-adjustments', icon: ArrowPathIcon },
];

// ... existing code ... 
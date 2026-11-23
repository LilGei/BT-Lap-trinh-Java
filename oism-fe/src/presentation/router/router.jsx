import { useState } from 'react';
import { createBrowserRouter, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/application/context/AppProvider';

import AuthLayout from '@/presentation/layouts/AuthLayout';
import MainLayout from '@/presentation/components/layout/MainLayout';

// Trang xác thực
import LoginUser from '@/presentation/pages/auth/LoginUser';
import AdminLogin from '@/presentation/pages/auth/AdminLogin';
import Register from '@/presentation/pages/auth/Register';
import ForgotPassword from '@/presentation/pages/auth/ForgotPassword';

// Trang bán hàng POS
import PosPage from '@/presentation/pages/pos/PosPage';

// Trang quản trị Admin
import OverviewPage from '@/presentation/pages/admin/OverviewPage';
import OrdersPage from '@/presentation/pages/admin/OrdersPage';
import WebhookSimulatorPage from '@/presentation/pages/admin/WebhookSimulatorPage';
import WarehousePage from '@/presentation/pages/admin/WarehousePage';
import InventoryAlertPage from '@/presentation/pages/admin/InventoryAlertPage';
import ReportsPage from '@/presentation/pages/admin/ReportsPage';
import ProductPage from '@/presentation/pages/admin/ProductPage';
import SkuPage from '@/presentation/pages/admin/SkuPage';
import CategoryPage from '@/presentation/pages/admin/CategoryPage';
import BrandPage from '@/presentation/pages/admin/BrandPage';
import ImportPage from '@/presentation/pages/admin/ImportPage';
import StocktakePage from '@/presentation/pages/admin/StocktakePage';
import TransferPage from '@/presentation/pages/admin/TransferPage';
import LedgerPage from '@/presentation/pages/admin/LedgerPage';
import AiSuggestPage from '@/presentation/pages/admin/AiSuggestPage';

const RootLayout = () => (
  <div className="app-container">
    <Outlet />
  </div>
);

function DashboardContainer() {
  const [currentPage, setCurrentPage] = useState('overview');
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Sửa lỗi nút Đăng xuất: xóa session và chuyển hướng về trang đăng nhập
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage />;
      case 'orders':
        return <OrdersPage />;
      case 'webhook':
        return <WebhookSimulatorPage />;
      case 'warehouse':
        return <WarehousePage />;
      case 'inventory-alert':
        return <InventoryAlertPage />;
      case 'reports':
        return <ReportsPage />;
      case 'pos':
        return <PosPage />;
      case 'products':
        return <ProductPage />;
      case 'sku':
        return <SkuPage />;
      case 'category':
      case 'categories':
        return <CategoryPage />;
      case 'brand':
      case 'brands':
        return <BrandPage />;
      case 'import':
        return <ImportPage />;
      case 'stocktake':
        return <StocktakePage />;
      case 'transfer':
        return <TransferPage />;
      case 'ledger':
        return <LedgerPage />;
      case 'ai-suggest':
        return <AiSuggestPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      {renderPage()}
    </MainLayout>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginUser /> },
          { path: 'admin-login', element: <AdminLogin /> },
          { path: 'register', element: <Register /> },
          { path: 'forgot', element: <ForgotPassword /> },
        ],
      },
      { path: 'pos', element: <PosPage /> },
      { path: '*', element: <DashboardContainer /> },
    ],
  },
]);
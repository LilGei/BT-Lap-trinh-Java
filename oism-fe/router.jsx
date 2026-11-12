import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';

import Login from './SRC/pages/LoginUser';
import Register from './SRC/pages/Register';
import ForgotPassword from './SRC/pages/ForgotPassword';
import AdminLogin from './SRC/pages/AdminLogin';

// Import thêm trang làm trang chính/tổng quan
import PosPage from './SRC/pages/PosPage';
import ProductPage from './SRC/pages/ProductPage';

const RootLayout = () => {
  return (
    <div className="app-container">
      <Outlet />
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <Login /> },
          { path: 'register', element: <Register /> },
          { path: 'forgot', element: <ForgotPassword /> },
        ],
      },
      { path: 'admin-login', element: <AdminLogin /> },
      
      // Thêm route trang bán hàng / quản lý tại đây:
      { path: 'pos', element: <PosPage /> },
      { path: 'products', element: <ProductPage /> },

      { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },
]);
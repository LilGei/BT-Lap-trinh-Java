import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AppProvider = ({ children }) => {
  // Lấy dữ liệu user ngay từ localStorage để tránh bị mất state khi F5 trang
  const [user, setUser] = useState(() => {
    const role = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    return role ? { role, username } : null;
  });

  const value = { user, setUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AppProvider;
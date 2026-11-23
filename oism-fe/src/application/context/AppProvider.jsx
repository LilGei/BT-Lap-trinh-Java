import React, { createContext, useContext, useState } from 'react';
import { tokenStorage } from '@/infrastructure/storage/tokenStorage';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => tokenStorage.getUser());

  const login = (sessionData) => {
    tokenStorage.setSession(sessionData);
    setUser({ role: sessionData.role, username: sessionData.username });
  };

  const logout = () => {
    tokenStorage.clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AppProvider;
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('nexora_token');
    const savedUser = authService.getCurrentUser();

    if (savedToken) {
      setToken(savedToken);
      setUser(savedUser || { email: 'user@nexora.com', name: 'Nexora User' });
    }
    setLoading(false);
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      // In early frontend setup when backend may not be running yet,
      // allow fallback demo authentication if network fails, or real API call
      try {
        const data = await authService.login({ email, password });
        setUser(data.user || { email, name: email.split('@')[0] });
        setToken(data.token || 'demo-token');
        return { success: true };
      } catch (err) {
        // Fallback for demo testing if backend is offline:
        if (err.message.includes('Network Error') || err.message.includes('Unable to connect')) {
          const fallbackUser = {
            id: 'demo-1',
            email,
            name: email.split('@')[0] || 'Nexora User',
          };
          const fallbackToken = 'demo-jwt-token-nexora';
          localStorage.setItem('nexora_token', fallbackToken);
          localStorage.setItem('nexora_user', JSON.stringify(fallbackUser));
          setUser(fallbackUser);
          setToken(fallbackToken);
          return { success: true, isDemo: true };
        }
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      try {
        const data = await authService.register({ name, email, password });
        setUser(data.user || { email, name });
        setToken(data.token || 'demo-token');
        return { success: true };
      } catch (err) {
        // Fallback for demo testing if backend is offline:
        if (err.message.includes('Network Error') || err.message.includes('Unable to connect')) {
          const fallbackUser = {
            id: 'demo-user-' + Date.now(),
            name,
            email,
          };
          const fallbackToken = 'demo-jwt-token-nexora';
          localStorage.setItem('nexora_token', fallbackToken);
          localStorage.setItem('nexora_user', JSON.stringify(fallbackUser));
          setUser(fallbackUser);
          setToken(fallbackToken);
          return { success: true, isDemo: true };
        }
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

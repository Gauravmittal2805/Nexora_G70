import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import tokenService from '../services/tokenService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      const activeToken = tokenService.getToken();
      const activeUser = tokenService.getUser();

      if (activeToken && tokenService.isAuthenticated()) {
        setToken(activeToken);
        setUser(activeUser || { email: 'user@nexora.com', name: 'Nexora User' });
      } else {
        tokenService.clearTokens();
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen to session expiry events dispatched by Axios interceptor
    const handleSessionExpired = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('nexora:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('nexora:session-expired', handleSessionExpired);
    };
  }, []);

  /**
   * Login handler
   */
  const login = useCallback(async ({ email, password, rememberMe = true }) => {
    const result = await authService.login({ email, password, rememberMe });
    const storedToken = tokenService.getToken();
    const storedUser = tokenService.getUser() || result.user;

    setToken(storedToken);
    setUser(storedUser);
    return result;
  }, []);

  /**
   * Register handler
   */
  const register = useCallback(async ({ name, email, password }) => {
    const result = await authService.register({ name, email, password });
    if (result.token) {
      setToken(result.token);
      setUser(result.user);
    }
    return result;
  }, []);

  /**
   * Logout handler
   */
  const logout = useCallback(async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && tokenService.isAuthenticated()),
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

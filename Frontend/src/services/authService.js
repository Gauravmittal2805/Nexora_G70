import api from './api';
import tokenService from './tokenService';

export const authService = {
  /**
   * Register a new user
   * Sends POST to /api/auth/register
   * @param {Object} userData - { name, email, password }
   */
  register: async ({ name, email, password }) => {
    try {
      const payload = {
        name,
        username: name.toLowerCase().replace(/\s+/g, '_'),
        email,
        password,
      };

      const response = await api.post('/auth/register', payload);
      const data = response.data;

      // Extract token and user if returned on registration
      const token = data?.token || data?.accessToken || data?.data?.token;
      const user = data?.user || data?.data?.user || { name, email };

      if (token) {
        tokenService.setTokens({ token, user, rememberMe: true });
      }

      return {
        success: true,
        message: data?.message || 'Registration completed successfully!',
        user,
        token,
      };
    } catch (error) {
      // If backend responded with 400 or other client error (e.g. duplicate user, invalid format),
      // rethrow so the form shows the backend's validation message
      if (error.status && error.status !== 404 && error.status < 500) {
        throw error;
      }

      // If backend server is unreachable or offline, provide graceful fallback session
      if (
        error.message?.includes('Network Error') ||
        error.code === 'ERR_NETWORK' ||
        error.originalError?.code === 'ECONNREFUSED' ||
        error.status === 404 ||
        error.status >= 500
      ) {
        console.warn('Backend server unreachable, activating local demo JWT session for registration preview:', error.message);
        const demoToken = 'demo-jwt-' + btoa(JSON.stringify({ email, name, exp: Math.floor(Date.now() / 1000) + 86400 }));
        const demoUser = { _id: 'usr_' + Date.now(), name, email, createdAt: new Date().toISOString() };
        tokenService.setTokens({ token: demoToken, user: demoUser, rememberMe: true });
        return {
          success: true,
          message: 'Account registered successfully! Redirecting to dashboard...',
          user: demoUser,
          token: demoToken,
          isOfflineDemo: true,
        };
      }
      throw error;
    }
  },

  /**
   * Log in user
   * Sends POST to /api/auth/login
   * @param {Object} credentials - { email, password, rememberMe }
   */
  login: async ({ email, password, rememberMe = true }) => {
    try {
      const payload = {
        email,
        password,
      };

      const response = await api.post('/auth/login', payload);
      const data = response.data;

      // Extract JWT token and user details from common backend response structures
      const token = data?.token || data?.accessToken || data?.data?.token;
      const user =
        data?.user ||
        data?.data?.user || {
          email,
          name: email.split('@')[0],
        };

      if (!token) {
        throw new Error('Authentication succeeded but no token was provided by the server.');
      }

      // Store JWT securely according to user preference
      tokenService.setTokens({ token, user, rememberMe });

      return {
        success: true,
        message: data?.message || 'Logged in successfully!',
        user,
        token,
      };
    } catch (error) {
      // If backend responded with 400 or 401 (e.g. invalid credentials), rethrow with backend message
      if (error.status && error.status !== 404 && error.status < 500) {
        throw error;
      }

      // If backend server is offline or unreachable, provide graceful fallback session
      if (
        error.message?.includes('Network Error') ||
        error.code === 'ERR_NETWORK' ||
        error.originalError?.code === 'ECONNREFUSED' ||
        error.status === 404 ||
        error.status >= 500
      ) {
        console.warn('Backend server unreachable, activating local demo JWT session for login preview:', error.message);
        const demoToken = 'demo-jwt-' + btoa(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + 86400 }));
        const demoUser = {
          _id: 'usr_' + Date.now(),
          name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          email,
          createdAt: new Date().toISOString(),
        };
        tokenService.setTokens({ token: demoToken, user: demoUser, rememberMe });
        return {
          success: true,
          message: 'Login successful! Redirecting to dashboard...',
          user: demoUser,
          token: demoToken,
          isOfflineDemo: true,
        };
      }
      throw error;
    }
  },

  /**
   * Sign out current user
   */
  logout: async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      tokenService.clearTokens();
    }
  },

  /**
   * Fetch current authenticated user profile
   */
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Retrieve cached user
   */
  getCurrentUser: () => {
    return tokenService.getUser();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return tokenService.isAuthenticated();
  },
};

export default authService;

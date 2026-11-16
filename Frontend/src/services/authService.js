import api from './api';
import tokenService from './tokenService';

export const authService = {
  /**
   * Register a new user
   * Sends POST to /api/auth/register (saves directly to MongoDB Nexora database)
   * Does NOT auto-login, enabling the user to explicitly log in next.
   * @param {Object} userData - { name, email, password }
   */
  register: async ({ name, email, password }) => {
    try {
      const payload = {
        name,
        email,
        password,
      };

      const response = await api.post('/auth/register', payload);
      const data = response.data;

      const user = data?.user || data?.data?.user || { name, email };

      return {
        success: true,
        message: data?.message || 'Account created successfully! Please sign in.',
        user,
      };
    } catch (error) {
      // Re-throw with clean message so user sees true validation / backend errors
      const message =
        error.data?.message ||
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please check server connection.';
      const err = new Error(message);
      err.status = error.status || error.response?.status;
      throw err;
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

      // Extract JWT token and user details from backend response
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
      const message =
        error.data?.message ||
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please verify your credentials.';
      const err = new Error(message);
      err.status = error.status || error.response?.status;
      throw err;
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

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
      // Send both name and username fields so it seamlessly matches any backend schema
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
      // In development, if backend server on :5000 is not reachable yet,
      // provide detailed diagnostic guidance
      if (
        error.message?.includes('Network Error') ||
        error.code === 'ERR_NETWORK' ||
        error.originalError?.code === 'ECONNREFUSED'
      ) {
        throw new Error(
          'Backend server is not running on port 5000. Please start the backend service or verify the API endpoint.'
        );
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
      if (
        error.message?.includes('Network Error') ||
        error.code === 'ERR_NETWORK' ||
        error.originalError?.code === 'ECONNREFUSED'
      ) {
        throw new Error(
          'Backend server is not running on port 5000. Please start the backend service or verify the API endpoint.'
        );
      }
      throw error;
    }
  },

  /**
   * Sign out current user
   */
  logout: async () => {
    try {
      // Attempt to notify backend if a logout endpoint exists
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

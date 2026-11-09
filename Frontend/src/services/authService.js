import api from './api';

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data?.token) {
        localStorage.setItem('nexora_token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('nexora_user', JSON.stringify(response.data.user));
        }
      }
      return response.data;
    } catch (error) {
      // If backend is not reached yet (e.g., during frontend-only development),
      // we can throw the error for the UI to handle appropriately
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to connect to authentication service.';
      throw new Error(message);
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data?.token) {
        localStorage.setItem('nexora_token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('nexora_user', JSON.stringify(response.data.user));
        }
      }
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to complete registration.';
      throw new Error(message);
    }
  },

  // Logout current user
  logout: () => {
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_user');
  },

  // Get current stored user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('nexora_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  // Check if token exists
  isAuthenticated: () => {
    return Boolean(localStorage.getItem('nexora_token'));
  },
};

export default authService;

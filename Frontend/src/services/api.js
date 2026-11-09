import axios from 'axios';
import tokenService from './tokenService';

// Determine base API URL
// In development, using relative '/api' leverages the Vite dev proxy to prevent CORS issues.
// Production can point to a configured environment variable or full endpoint.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
  withCredentials: true, // Enables sending HTTP-only cookies if backend uses cookie auth
});

// Request Interceptor: Attach JWT Bearer Token if present
api.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format error messages & handle 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Session expiration / unauthorized
    if (error.response && error.response.status === 401) {
      tokenService.clearTokens();
      // Dispatch a custom event so React can react without a hard page reload
      window.dispatchEvent(new CustomEvent('nexora:session-expired'));
    }

    // Extract cleanest user-facing error message
    const customMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.code === 'ECONNABORTED'
        ? 'Request timed out. Please check your network connection.'
        : error.message || 'An unexpected error occurred.');

    const enrichedError = new Error(customMessage);
    enrichedError.status = error.response?.status;
    enrichedError.originalError = error;
    enrichedError.data = error.response?.data;

    return Promise.reject(enrichedError);
  }
);

export default api;

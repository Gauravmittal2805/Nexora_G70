/**
 * Secure Token Storage Service
 * Manages JWT storage using a dual-storage strategy:
 * - If "rememberMe" is true, stores in localStorage (persistent).
 * - If "rememberMe" is false, stores in sessionStorage (cleared upon browser tab close,
 *   reducing persistent exposure to XSS).
 * - Also provides an in-memory cache for ultra-fast and secure access.
 */

const TOKEN_KEY = 'nexora_auth_token';
const USER_KEY = 'nexora_auth_user';

let inMemoryToken = null;
let inMemoryUser = null;

export const tokenService = {
  /**
   * Save token and user details to storage and memory
   */
  setTokens: ({ token, user = null, rememberMe = true }) => {
    inMemoryToken = token;
    inMemoryUser = user;

    if (!token) return;

    // Clear from both first to prevent stale sync
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);

    const storage = rememberMe ? localStorage : sessionStorage;
    try {
      storage.setItem(TOKEN_KEY, token);
      if (user) {
        storage.setItem(USER_KEY, JSON.stringify(user));
      }
    } catch (e) {
      console.warn('Storage quota exceeded or storage disabled:', e);
    }
  },

  /**
   * Retrieve JWT from in-memory cache, sessionStorage, or localStorage
   */
  getToken: () => {
    if (inMemoryToken) return inMemoryToken;
    const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (token) inMemoryToken = token;
    return token;
  },

  /**
   * Retrieve user profile details
   */
  getUser: () => {
    if (inMemoryUser) return inMemoryUser;
    const userStr = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        inMemoryUser = JSON.parse(userStr);
        return inMemoryUser;
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Remove token and user data on logout or session expiration
   */
  clearTokens: () => {
    inMemoryToken = null;
    inMemoryUser = null;
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  /**
   * Decode payload from standard JWT without external heavy libraries
   */
  decodeJwt: (token) => {
    try {
      if (!token || typeof token !== 'string') return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  },

  /**
   * Check if token exists and is not expired
   */
  isAuthenticated: () => {
    const token = tokenService.getToken();
    if (!token) return false;

    // Check expiration if token is a valid JWT
    const decoded = tokenService.decodeJwt(token);
    if (decoded && decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        tokenService.clearTokens();
        return false;
      }
    }
    return true;
  },
};

export default tokenService;

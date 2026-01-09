const AUTH_KEY = 'auth_token';
const ADMIN_PASSWORD = 'admin123';

export const authService = {
  login: (password) => {
    if (password === ADMIN_PASSWORD) {
      const token = btoa(`admin:${Date.now()}`);
      localStorage.setItem(AUTH_KEY, token);
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  isAuthenticated: () => {
    return !!localStorage.getItem(AUTH_KEY);
  },

  getToken: () => {
    return localStorage.getItem(AUTH_KEY);
  },
};
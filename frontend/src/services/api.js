import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const flagService = {
  getAll: async (enabled) => {
    const params = enabled !== undefined ? { enabled } : {};
    const response = await api.get('/flags', { params });
    return response.data;
  },

  getByKey: async (key) => {
    const response = await api.get(`/flags/${key}`);
    return response.data;
  },

  create: async (flagData) => {
    const response = await api.post('/flags', flagData);
    return response.data;
  },

  update: async (key, updates) => {
    const response = await api.put(`/flags/${key}`, updates);
    return response.data;
  },

  delete: async (key) => {
    const response = await api.delete(`/flags/${key}`);
    return response.data;
  },

  toggle: async (key) => {
    const response = await api.patch(`/flags/${key}/toggle`);
    return response.data;
  },
};

export const evaluateService = {
  evaluate: async (flagKey, userId, attributes = {}) => {
    const response = await api.post('/evaluate', { flagKey, userId, attributes });
    return response.data;
  },

  evaluateBulk: async (flagKeys, userId, attributes = {}) => {
    const response = await api.post('/evaluate/bulk', { flagKeys, userId, attributes });
    return response.data;
  },

  getAll: async (userId, attributes = {}) => {
    const response = await api.post('/evaluate/all', { userId, attributes });
    return response.data;
  },
};

export default api;
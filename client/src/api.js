import axios from 'axios';

// In dev, same-origin /api is proxied to the Express server (see vite.config.js).
const API =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : '${import.meta.env.VITE_API_URL}');

const api = axios.create({
  baseURL: API,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

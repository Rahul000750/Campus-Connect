import axios from 'axios';

const NETWORK_ERROR_COOLDOWN_MS = 10_000;
let lastNetworkErrorAt = 0;

function isAbsoluteHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function normalizeApiBaseUrl(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '/api';

  if (!isAbsoluteHttpUrl(value)) {
    return value.startsWith('/') ? value : `/${value}`;
  }

  // Avoid mixed-content requests when frontend is served via HTTPS.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && value.startsWith('http://')) {
    return value.replace(/^http:\/\//i, 'https://');
  }
  return value.replace(/\/+$/, '');
}

// In dev, same-origin /api is proxied to the Express server (see vite.config.js).
// Fallback to `/api` keeps local and same-origin deployments working even if env is unset.
const API = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.message === 'Network Error') {
      lastNetworkErrorAt = Date.now();
    }
    return Promise.reject(error);
  }
);

export function getApiBaseUrl() {
  return api.defaults?.baseURL || '/api';
}

export function shouldThrottleNetworkRequests() {
  if (!lastNetworkErrorAt) return false;
  return Date.now() - lastNetworkErrorAt < NETWORK_ERROR_COOLDOWN_MS;
}

export function getFriendlyApiError(error, fallbackMessage) {
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;
  if (error?.message === 'Network Error') {
    const baseURL = getApiBaseUrl();
    return `Cannot reach the API at ${baseURL}. Check VITE_API_URL and your production API deployment.`;
  }
  return fallbackMessage;
}

export function normalizeMediaUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (!isAbsoluteHttpUrl(value)) return value;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && value.startsWith('http://')) {
    return value.replace(/^http:\/\//i, 'https://');
  }
  return value;
}

export default api;

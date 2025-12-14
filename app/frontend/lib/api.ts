import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError, AxiosAdapter } from 'axios';
import { getCookie } from 'cookies-next';
import { handleMockRequest } from './mockApi';

// Default to MOCK enabled if not explicitly disabled. 
// This ensures the demo works out-of-the-box without .env configuration.
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',

  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000,
});

// Debug Log
if (typeof window !== 'undefined') {
  console.log('[API] Initializing. Mock Mode:', USE_MOCK_API);
}

// Request interceptor for Auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getCookie('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock API Adapter
if (USE_MOCK_API) {
  const mockAdapter: AxiosAdapter = async (config) => {
    console.log('[API] Mock Adapter processing:', config.url);

    // Skip if it's an external URL (like OpenStreetMap or Analytics)
    // Checks if url starts with http/https and is NOT localhost
    if (config.url?.match(/^https?:\/\//) && !config.url.includes('127.0.0.1')) {
      console.log('[API] Mock Adapter skipping external URL');
      const defaultAdapter = axios.defaults.adapter as AxiosAdapter;
      // In some envs, defaults.adapter might be undefined or a list. 
      // If specific adapter not found, fall back to "http" or "xhr" if available, or just throw.
      if (defaultAdapter) {
        return defaultAdapter(config);
      }
      // If we are here, we are likely in a confused state. 
      // Try resolving directly if possible or throw specific error.
      throw new Error('External URL request in Mock Mode failed: No default adapter');
    }

    try {
      const [status, data] = await handleMockRequest(config);
      console.log('[API] Mock Response:', status);

      return {
        data,
        status,
        statusText: status === 200 ? 'OK' : 'Mock Response',
        headers: {},
        config,
        request: {}
      };
    } catch (err) {
      console.error('[API] Mock Adapter Error:', err);
      // If the mock handler specifically crashes
      return Promise.reject(err);
    }
  };

  api.defaults.adapter = mockAdapter;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out (Client side limit)');
    }
    if (error.response) {
      // Сервер ответил ошибкой (4xx, 5xx)
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      // Сервер не ответил вообще
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
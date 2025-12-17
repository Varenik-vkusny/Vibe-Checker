import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError, AxiosAdapter } from 'axios';
import { getCookie } from 'cookies-next';
import { handleMockRequest } from './mockApi';

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',

  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000,
});

if (typeof window !== 'undefined') {
  console.log('[API] Initializing. Mock Mode:', USE_MOCK_API);
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getCookie('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

if (USE_MOCK_API) {
  const mockAdapter: AxiosAdapter = async (config) => {
    console.log('[API] Mock Adapter processing:', config.url);

    if (config.url?.match(/^https?:\/\//) && !config.url.includes('127.0.0.1')) {
      console.log('[API] Mock Adapter skipping external URL');
      const defaultAdapter = axios.defaults.adapter as AxiosAdapter;
      if (defaultAdapter) {
        return defaultAdapter(config);
      }
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
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
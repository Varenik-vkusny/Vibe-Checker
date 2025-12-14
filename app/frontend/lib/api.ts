import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getCookie } from 'cookies-next';
import { handleMockRequest } from './mockApi';

// CORRECTED LOGIC: Check explicitly for 'true' string.
// Default to false if not set.
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'false';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', 
  
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000,  
});

// Request interceptor for Auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getCookie('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock API Interceptor
if (USE_MOCK_API) {
  console.log('--- ⚠️ MOCK API ENABLED ⚠️ ---');
  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    // Skip if it's an external URL (like OpenStreetMap or Analytics)
    if (config.url?.startsWith('http')) {
        return config;
    }

    // Process mock request
    const [status, data] = await handleMockRequest(config);
    
    // Throw a specific error to bypass the actual network request
    const error: any = new Error('Mock Request');
    error.mockResponse = {
        data,
        status,
        statusText: 'OK',
        headers: {},
        config,
    };
    throw error;
  });

  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: any) => {
      // If it's our mock response object, return it as a successful response
      if (error.mockResponse) {
        return Promise.resolve(error.mockResponse);
      }
      return Promise.reject(error);
    }
  );
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
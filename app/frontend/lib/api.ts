import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getCookie } from 'cookies-next';
import { handleMockRequest } from './mockApi';

// FIX: Correct logic. If ENV is 'true', USE_MOCK_API is true.
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'false';

const api = axios.create({
  baseURL: '/api', // When mock is false, this hits next.config.ts rewrites -> Django
  headers: {
    'Content-Type': 'application/json',
  },
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
  console.log('--- MOCK API ENABLED ---');
  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    // Skip if it's an external URL (like OpenStreetMap)
    if (config.url?.startsWith('http')) {
        return config;
    }

    const [status, data] = await handleMockRequest(config);
    
    // Throw an error to bypass the actual network request
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
      // If it's our mock response, return it as a successful response
      if (error.mockResponse) {
        return Promise.resolve(error.mockResponse);
      }
      return Promise.reject(error);
    }
  );
}

export default api;
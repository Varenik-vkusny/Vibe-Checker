import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getCookie } from 'cookies-next';
import { handleMockRequest } from './mockApi';

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'false';

const api = axios.create({
  baseURL: '/api',
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
  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    // Skip if it's an external URL (like OpenStreetMap)
    if (config.url?.startsWith('http')) {
        return config;
    }

    const [status, data] = await handleMockRequest(config);
    
    // Throw an error to bypass the actual network request
    // We attach the mock response to the error object to be caught by the response interceptor
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

import { AxiosRequestConfig } from 'axios';

// Mock Data
const MOCK_USER = {
  id: 1,
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

// A valid-looking JWT token (header.payload.signature)
// Payload: { "sub": "test@example.com", "name": "Test User", "iat": 1516239022 }
const MOCK_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const MOCK_TOKEN = {
  access_token: MOCK_JWT,
  token_type: 'bearer',
};

const MOCK_PLACES = [
  {
    name: 'The Cozy Corner',
    address: '123 High St, London',
    match_score: 95,
    reason: 'Perfect match for "cozy cafe with wifi". Great atmosphere and quiet corners.',
    lat: 51.505,
    lon: -0.09,
  },
  {
    name: 'Brew & Bean',
    address: '456 Oxford St, London',
    match_score: 88,
    reason: 'Good coffee and wifi, but can be a bit busy.',
    lat: 51.51,
    lon: -0.1,
  },
  {
    name: 'Library Lounge',
    address: '789 King Rd, London',
    match_score: 92,
    reason: 'Very quiet, excellent for working.',
    lat: 51.515,
    lon: -0.095,
  },
];

const MOCK_COMPARISON = {
  comparison: {
    verdict: 'The Cozy Corner',
    place_a_unique_pros: ['Quieter atmosphere', 'Better coffee', 'More comfortable seating'],
    place_b_unique_pros: ['Cheaper options', 'Open later'],
    winner_category: {
      food: 'The Cozy Corner',
      service: 'The Cozy Corner',
      atmosphere: 'The Cozy Corner',
      value: 'Brew & Bean',
    },
  },
  place_a: { name: 'The Cozy Corner' },
  place_b: { name: 'Brew & Bean' },
};

const MOCK_ANALYSIS = {
  place_info: { name: 'The Cozy Corner' },
  ai_analysis: {
    summary: { verdict: 'A delightful spot for remote work and relaxation.' },
    tags: ['Cozy', 'Quiet', 'Good Coffee', 'WiFi'],
    scores: {
      food: 85,
      service: 90,
      atmosphere: 95,
      value: 80,
    },
    detailed_attributes: {
      noise_level: 'Low',
      service_speed: 'Fast',
      cleanliness: 'Immaculate',
    },
    price_level: '$$',
  },
};

// Mock Handler
export const handleMockRequest = async (config: AxiosRequestConfig): Promise<any> => {
  const { url, method } = config;
  
  console.log(`[Mock API] ${method?.toUpperCase()} ${url}`);

  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

  if (url === '/users/token' && method === 'post') {
    return [200, MOCK_TOKEN];
  }

  if (url === '/users/' && method === 'post') {
    return [200, MOCK_USER];
  }

  if (url === '/place/pro_analyze' && method === 'post') {
    return [200, { recommendations: MOCK_PLACES }];
  }

  if (url === '/place/compare' && method === 'post') {
    return [200, MOCK_COMPARISON];
  }

  if (url === '/place/analyze' && method === 'post') {
    return [200, MOCK_ANALYSIS];
  }

  // Default 404
  return [404, { message: 'Mock endpoint not found' }];
};
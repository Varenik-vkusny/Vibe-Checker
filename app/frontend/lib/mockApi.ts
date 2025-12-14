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

// Richer Place Data for UI
const MOCK_PLACES_DETAILED = [
  {
    id: '1',
    name: 'Burger King Center',
    address: 'Fast Food • 1.2km away',
    match_score: 98,
    rating: 4.8,
    reviewCount: 262,
    category: 'Fast Food',
    priceLevel: '$$',
    openStatus: 'Open Now',
    tags: ['Fast', 'Cheap', 'Student Friendly'],
    reason: 'High energy, fast service, popular with students.',
    lat: 51.505,
    lon: -0.09,
    description: 'High energy, fast service, popular with students.',
    subRatings: { food: 85, service: 90 },
    vibeSignature: { noise: 'High', light: 'Bright', wifi: 'Fast' },
    crowdMakeup: { students: 60, families: 30, remote: 10 }
  },
  {
    id: '2',
    name: 'KFC Downtown',
    address: 'Chicken • 0.5km away',
    match_score: 85,
    rating: 4.5,
    reviewCount: 180,
    category: 'Chicken',
    priceLevel: '$',
    openStatus: 'Closed',
    tags: ['Crispy', 'Casual'],
    reason: 'Classic spot, good for quick bites.',
    lat: 51.51,
    lon: -0.1,
    description: 'A reliable spot for late night cravings.',
    subRatings: { food: 80, service: 70 },
    vibeSignature: { noise: 'Medium', light: 'Neon', wifi: 'No' },
    crowdMakeup: { students: 80, families: 10, remote: 10 }
  },
  {
    id: '3',
    name: "McDonald's",
    address: 'Burgers • 2.0km away',
    match_score: 92,
    rating: 4.7,
    reviewCount: 500,
    category: 'Burgers',
    priceLevel: '$',
    openStatus: 'Open Now',
    tags: ['Classic', '24/7'],
    reason: 'Reliable wifi and consistent coffee.',
    lat: 51.515,
    lon: -0.095,
    description: 'Standard McD experience, surprisingly quiet in the mornings.',
    subRatings: { food: 75, service: 95 },
    vibeSignature: { noise: 'Medium', light: 'Bright', wifi: 'Fast' },
    crowdMakeup: { students: 20, families: 60, remote: 20 }
  },
];

// ... (Comparison and Analysis mocks remain similar) ...

export const handleMockRequest = async (config: AxiosRequestConfig): Promise<any> => {
  const { url, method } = config;

  // Normalize URL: remove protocol, domain, and optional /api prefix
  // Transforms "http://127.0.0.1:8000/place/pro_analyze" -> "/place/pro_analyze"
  const cleanUrl = url?.replace(/^https?:\/\/[^\/]+/, '').replace(/^\/api/, '') || '';

  console.log(`[Mock API] ${method?.toUpperCase()} ${cleanUrl}`);

  await new Promise(resolve => setTimeout(resolve, 600));

  if (cleanUrl === '/users/token' && method === 'post') {
    return [200, MOCK_TOKEN];
  }

  if (cleanUrl === '/users/' && method === 'post') {
    return [200, MOCK_USER];
  }

  if (cleanUrl === '/users/me' && method === 'get') {
    return [200, { ...MOCK_USER, role: 'USER' }];
  }

  // Updated to return the detailed structure
  if (cleanUrl === '/place/pro_analyze' && method === 'post') {
    return [200, { recommendations: MOCK_PLACES_DETAILED }];
  }

  // Fallback for analysis
  if (cleanUrl === '/place/analyze' && method === 'post') {
    return [200, {
      place_info: { name: 'Mock Place' },
      ai_analysis: {
        summary: { verdict: 'Great place!' },
        tags: ['Cozy'],
        scores: { food: 80, service: 80, atmosphere: 80, value: 80 },
        detailed_attributes: { noise_level: 'Low' },
        price_level: '$$'
      }
    }];
  }

  if (cleanUrl === '/place/compare' && method === 'post') {
    return [200, {
      comparison: {
        verdict: 'Burger King Center',
        verdict_text: 'Choose Burger King for speed and value, but choose KFC if you prioritize flavor profile.',
        scores: {
          place_a: { food: 85, service: 92, atmosphere: 70, value: 95 },
          place_b: { food: 88, service: 75, atmosphere: 78, value: 82 }
        },
        place_a_unique_pros: ['Open 24/7', 'Drive-thru', 'Refillable Drinks', 'Faster Wifi'],
        place_b_unique_pros: ['Original Recipe', 'Better Sides', 'Spicier Options', 'Less Crowded'],
        winner_category: { food: 'Place B', service: 'Place A', atmosphere: 'Place B', value: 'Place A' }
      },
      place_a: { name: 'Burger King Center', price_level: '$$' },
      place_b: { name: 'KFC Downtown', price_level: '$$$' }
    }];
  }

  return [404, { message: 'Mock endpoint not found' }];
};
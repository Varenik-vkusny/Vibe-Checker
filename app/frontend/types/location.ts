export interface LocationData {
  id: string;
  place_id?: number;
  name: string;
  address: string;
  coordinates: [number, number];
  rating: number;
  reviewCount: number;
  vibeScore?: number;
  description?: string;
  category: string;
  priceLevel?: string; 
  openStatus?: 'Open Now' | 'Closed';
  reason?: string;
  distance?: string; 
  tags?: string[]; 
  subRatings?: {
    food: number;
    service: number;
    atmosphere?: number;
    value?: number;
  };
  vibeSignature?: {
    noise: 'Low' | 'Medium' | 'High';
    light: 'Dim' | 'Bright' | 'Neon';
    wifi: 'No' | 'Slow' | 'Fast';
  };
  crowdMakeup?: {
    students: number; // percentage
    families: number;
    remote: number;
  };
  imageUrl?: string;
  userInteraction?: {
    isLiked: boolean;
    isDisliked: boolean;
    isVisited: boolean;
    isSaved?: boolean;
  };
  photos?: string[]; // Array of photo URLs
}
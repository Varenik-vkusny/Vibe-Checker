// app/(dashboard)/map/Map2GISClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LocationData {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  rating?: number;
  reviewCount?: number;
  vibeScore?: number;
  description?: string;
  category?: string;
}

declare global {
  interface Window {
    mapgl: any; // Define mapgl on the window object
  }
}

const Map2GISClient = ({ mode, query }: { mode?: string; query?: string }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // Store the map instance
  const markersRef = useRef<any[]>([]); // Store marker instances
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Show loading until map initializes

  // Mock data for demonstration purposes
  const mockAnalysisResults: LocationData[] = [
    {
      id: 'loc1',
      name: 'Cozy Corner Cafe',
      address: '123 Main St, Downtown',
      coordinates: [55.31878, 25.23584],
      rating: 4.5,
      reviewCount: 128,
      vibeScore: 92,
      description: 'A quiet spot perfect for reading and working.',
      category: 'Cafe'
    },
    {
      id: 'loc2',
      name: 'Sunset Lounge Bar',
      address: '456 Beach Rd, Marina',
      coordinates: [55.28925, 25.21161],
      rating: 4.2,
      reviewCount: 87,
      vibeScore: 88,
      description: 'Great atmosphere for evening drinks with a view.',
      category: 'Bar'
    },
    {
      id: 'loc3',
      name: 'Central Library Branch',
      address: '789 Park Ave, City Center',
      coordinates: [55.34418, 25.21534],
      rating: 4.0,
      reviewCount: 201,
      vibeScore: 75,
      description: 'Spacious and well-lit, ideal for focused study.',
      category: 'Library'
    },
    {
      id: 'loc4',
      name: 'Tech Hub Workspace',
      address: '321 Innovation Blvd, Tech District',
      coordinates: [55.35036, 25.26068],
      rating: 4.7,
      reviewCount: 54,
      vibeScore: 95,
      description: 'Modern facilities with high-speed internet and meeting rooms.',
      category: 'Workspace'
    },
    {
      id: 'loc5',
      name: 'Herb Garden Eatery',
      address: '567 Garden Ln, Green Park',
      coordinates: [55.32976, 25.23832],
      rating: 4.3,
      reviewCount: 92,
      vibeScore: 89,
      description: 'Fresh, organic meals in a serene garden setting.',
      category: 'Restaurant'
    }
  ];

  // Load the 2GIS MapGL script dynamically
  useEffect(() => {
    if (!window.mapgl) {
      const script = document.createElement('script');
      script.src = 'https://mapgl.2gis.com/api/js/v1';
      script.async = true;
      script.onload = () => {
        initializeMap();
      };
      script.onerror = () => {
        console.error('Failed to load 2GIS MapGL API');
        setIsLoading(false); // Stop loading indicator even on error
      };
      document.head.appendChild(script);
    } else {
      // If script is already loaded (e.g., on hot reload), initialize immediately
      initializeMap();
    }

    // Cleanup function to destroy map when component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      // Clean up markers if any exist
      markersRef.current.forEach(marker => {
        if (marker && typeof marker.destroy === 'function') {
          marker.destroy();
        }
      });
      markersRef.current = [];
    };
  }, []);

  const initializeMap = () => {
    if (mapContainerRef.current && window.mapgl) {
      // Create the map instance
      mapRef.current = new window.mapgl.Map(
        mapContainerRef.current,
        {
          center: [55.31878, 25.23584], // Default center
          zoom: 13,
          key: '019cced9-f6a6-4f10-b7c3-b6d91a0d0e35', // Hardcoded API key placeholder
        }
      );

      // Add markers based on mode and data
      let locationsToDisplay: LocationData[] = [];

      if (mode === 'analysis') {
        // Use mock data for analysis mode for now
        locationsToDisplay = mockAnalysisResults;
        // Optionally, adjust map center/zoom based on results
        if (locationsToDisplay.length > 0) {
           // Simple example: focus on the first result
          mapRef.current.setCenter(locationsToDisplay[0].coordinates);
        }
      } else {
        // Default view or handle other modes
        // For now, just show the map without specific markers
      }

      // Create markers for the locations
      locationsToDisplay.forEach(loc => {
        const marker = new window.mapgl.Marker(mapRef.current, {
          coordinates: loc.coordinates,
          icon: 'https://docs.2gis.com/img/mapgl/marker.svg', // Example icon
          label: { text: loc.name },
        });

        // Attach click event listener to the marker
        marker.on('click', () => {
          setSelectedLocation(loc);
          setSidebarOpen(true);
        });

        markersRef.current.push(marker); // Store marker reference
      });

      // Set loading state to false once map is initialized and markers are added
      mapRef.current.on('idle', () => {
         setIsLoading(false);
      });
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setSelectedLocation(null);
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div id="container" ref={mapContainerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background flex items-center justify-center z-10">
          <div className="text-foreground">Loading map...</div>
        </div>
      )}

      {/* Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedLocation?.name}</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedLocation?.category}</Badge>
              <span className="text-sm text-muted-foreground">{selectedLocation?.address}</span>
            </div>
            {selectedLocation?.rating !== undefined && (
              <div className="flex items-center gap-4">
                <div>
                  <span className="font-medium">Rating:</span> {selectedLocation.rating}/5
                </div>
                <div>
                  <span className="font-medium">Reviews:</span> {selectedLocation.reviewCount}
                </div>
                 <div>
                  <span className="font-medium">Vibe Score:</span> {selectedLocation.vibeScore}/100
                </div>
              </div>
            )}
            {selectedLocation?.description && (
              <p className="text-foreground">{selectedLocation.description}</p>
            )}
            {/* Add more details as needed */}
            <Button onClick={closeSidebar}>Close</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Map2GISClient;
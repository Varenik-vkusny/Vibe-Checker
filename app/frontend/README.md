# Vibe-Checker Frontend

This is the Next.js frontend for Vibe-Checker.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## Configuration

- The app proxies API requests to `http://127.0.0.1:8000`. Ensure your Python backend is running on this port.
- Authentication uses the backend's JWT token system.
- Maps use OpenStreetMap tiles and Nominatim for geocoding (no API key required).

## Features

- **Auth**: Login/Register with the Python backend.
- **Map**: Interactive map with "Search by Vibe" functionality.
- **Analysis**: Analyze places using the backend's AI.
- **Compare**: Compare two places side-by-side.
- **Profile**: View user stats and saved places.

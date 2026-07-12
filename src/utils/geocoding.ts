export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

// Simple memory cache to prevent rate-limiting from Nominatim (1 req/sec limit)
const geocodeCache = new Map<string, GeocodeResult | null>();

/**
 * Geocodes an address string to coordinates using OpenStreetMap Nominatim API.
 * Uses a memory cache to avoid duplicate requests.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address) return null;
  
  const cacheKey = address.toLowerCase().trim();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) || null;
  }

  try {
    // Add a small delay for requests to respect Nominatim's rate limit if we make multiple calls rapidly
    await new Promise(resolve => setTimeout(resolve, 500));

    const query = encodeURIComponent(address);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        // Nominatim requests a User-Agent to identify the application
        'User-Agent': 'TransitOps-Dashboard/1.0'
      }
    });

    if (!response.ok) {
      console.warn('Geocoding failed for:', address);
      geocodeCache.set(cacheKey, null);
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      const result: GeocodeResult = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
      geocodeCache.set(cacheKey, result);
      return result;
    }

    // Cache the miss so we don't keep trying
    geocodeCache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.error('Error during geocoding:', error);
    return null;
  }
}

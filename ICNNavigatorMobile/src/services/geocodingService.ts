import { Platform } from 'react-native';

// Replace with your actual API key
const GOOGLE_GEOCODING_API_KEY = 'AIzaSyBsJb-fpJij7dFzZC9QbO4DsGXlw1c2-n0';

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

// Cache to avoid repeated API calls for the same address
const geocodeCache = new Map<string, GeocodingResult>();

/**
 * Geocode an address using Google Geocoding API
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  // Check cache first
  const cacheKey = address.toLowerCase().trim();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    // Append Australia to address for better accuracy if not already included
    let searchAddress = address;
    if (!address.toLowerCase().includes('australia') && 
        !address.toLowerCase().includes('new zealand') &&
        !address.toLowerCase().includes(', nz') &&
        !address.toLowerCase().includes(', au')) {
      // Check if it's a New Zealand address
      if (address.includes(', NI') || address.includes(', SI') || 
          address.toLowerCase().includes('auckland') || 
          address.toLowerCase().includes('wellington') ||
          address.toLowerCase().includes('christchurch')) {
        searchAddress = `${address}, New Zealand`;
      } else {
        searchAddress = `${address}, Australia`;
      }
    }

    const encodedAddress = encodeURIComponent(searchAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_GEOCODING_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      
      const geocodingResult: GeocodingResult = {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address
      };
      
      // Cache the result
      geocodeCache.set(cacheKey, geocodingResult);
      
      return geocodingResult;
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn(`No geocoding results for address: ${address}`);
      return null;
    } else {
      console.error('Geocoding API error:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('Error geocoding address:', address, error);
    return null;
  }
}

/**
 * Batch geocode multiple addresses with rate limiting
 */
export async function batchGeocodeAddresses(
  addresses: string[], 
  onProgress?: (processed: number, total: number) => void
): Promise<Map<string, GeocodingResult | null>> {
  const results = new Map<string, GeocodingResult | null>();
  const BATCH_SIZE = 10; // Process 10 at a time
  const DELAY_MS = 100; // Delay between batches to respect rate limits
  
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, Math.min(i + BATCH_SIZE, addresses.length));
    
    // Process batch in parallel
    const batchPromises = batch.map(async (address) => {
      const result = await geocodeAddress(address);
      results.set(address, result);
      return result;
    });
    
    await Promise.all(batchPromises);
    
    // Update progress
    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, addresses.length), addresses.length);
    }
    
    // Delay before next batch (except for last batch)
    if (i + BATCH_SIZE < addresses.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  return results;
}

/**
 * Get fallback coordinates for Australian states and NZ territories
 */
export function getFallbackCoordinates(state: string): GeocodingResult {
  const stateCapitals: Record<string, GeocodingResult> = {
    // Australian State Capitals
    'VIC': { latitude: -37.8136, longitude: 144.9631 }, // Melbourne
    'NSW': { latitude: -33.8688, longitude: 151.2093 }, // Sydney
    'QLD': { latitude: -27.4698, longitude: 153.0251 }, // Brisbane
    'SA': { latitude: -34.9285, longitude: 138.6007 },  // Adelaide
    'WA': { latitude: -31.9505, longitude: 115.8605 },  // Perth
    'NT': { latitude: -12.4634, longitude: 130.8456 },  // Darwin
    'TAS': { latitude: -42.8821, longitude: 147.3272 }, // Hobart
    'ACT': { latitude: -35.2809, longitude: 149.1300 }, // Canberra
    
    // New Zealand
    'NI': { latitude: -36.8485, longitude: 174.7633 },  // Auckland (North Island)
    'SI': { latitude: -43.5321, longitude: 172.6362 },  // Christchurch (South Island)
  };
  
  return stateCapitals[state] || stateCapitals['VIC']; // Default to Melbourne
}

/**
 * Clear geocoding cache
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear();
}

/**
 * Get cache statistics
 */
export function getGeocodeStats(): { cacheSize: number; hits: number } {
  return {
    cacheSize: geocodeCache.size,
    hits: 0 // Would need to track this separately if needed
  };
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geocodeAddress, getFallbackCoordinates } from './geocodingService';

interface GeocodeCacheEntry {
  address: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  isGeocoded: boolean; // true if geocoded, false if fallback
}

interface GeocodeCache {
  version: string;
  lastUpdated: string;
  entries: Record<string, GeocodeCacheEntry>;
}

const CACHE_KEY = '@ICN_GEOCODE_CACHE';
const CACHE_VERSION = '1.0.0';
const CACHE_EXPIRY_DAYS = 30; // Re-geocode after 30 days

class GeocodeCacheService {
  private static instance: GeocodeCacheService;
  private cache: GeocodeCache | null = null;
  private pendingWrites: Set<string> = new Set();
  private writeDebounceTimer: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.loadCache();
  }
  
  static getInstance(): GeocodeCacheService {
    if (!GeocodeCacheService.instance) {
      GeocodeCacheService.instance = new GeocodeCacheService();
    }
    return GeocodeCacheService.instance;
  }
  
  /**
   * Load cache from AsyncStorage
   */
  async loadCache(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem(CACHE_KEY);
      if (cacheData) {
        const parsedCache = JSON.parse(cacheData) as GeocodeCache;
        
        // Check version compatibility
        if (parsedCache.version === CACHE_VERSION) {
          this.cache = parsedCache;
          console.log(`Loaded geocode cache with ${Object.keys(parsedCache.entries).length} entries`);
        } else {
          console.log('Cache version mismatch, creating new cache');
          this.cache = this.createEmptyCache();
        }
      } else {
        console.log('No geocode cache found, creating new one');
        this.cache = this.createEmptyCache();
      }
    } catch (error) {
      console.error('Error loading geocode cache:', error);
      this.cache = this.createEmptyCache();
    }
  }
  
  /**
   * Create empty cache structure
   */
  private createEmptyCache(): GeocodeCache {
    return {
      version: CACHE_VERSION,
      lastUpdated: new Date().toISOString(),
      entries: {}
    };
  }
  
  /**
   * Save cache to AsyncStorage (debounced)
   */
  private async saveCache(): Promise<void> {
    // Debounce writes to avoid excessive storage operations
    if (this.writeDebounceTimer) {
      clearTimeout(this.writeDebounceTimer);
    }
    
    this.writeDebounceTimer = setTimeout(async () => {
      try {
        if (this.cache) {
          this.cache.lastUpdated = new Date().toISOString();
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
          console.log(`Saved geocode cache with ${Object.keys(this.cache.entries).length} entries`);
        }
      } catch (error) {
        console.error('Error saving geocode cache:', error);
      }
    }, 1000); // Save after 1 second of inactivity
  }
  
  /**
   * Generate cache key from address components
   */
  private generateCacheKey(street: string, city: string, state: string, postcode: string): string {
    // Create a normalized key from address components
    const parts = [street, city, state, postcode]
      .filter(part => part && part !== 'Address Not Available' && part !== 'City Not Available')
      .map(part => part.trim().toLowerCase());
    
    return parts.join('|');
  }
  
  /**
   * Check if cache entry is expired
   */
  private isExpired(timestamp: string): boolean {
    const entryDate = new Date(timestamp);
    const now = new Date();
    const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > CACHE_EXPIRY_DAYS;
  }
  
  /**
   * Get coordinates with caching
   */
  async getCoordinatesWithCache(
    street: string,
    city: string,
    state: string,
    postcode: string,
    forceRefresh: boolean = false
  ): Promise<{ latitude: number; longitude: number; fromCache: boolean }> {
    // Ensure cache is loaded
    if (!this.cache) {
      await this.loadCache();
    }
    
    const cacheKey = this.generateCacheKey(street, city, state, postcode);
    
    // Check cache if not forcing refresh
    if (!forceRefresh && this.cache && cacheKey) {
      const cachedEntry = this.cache.entries[cacheKey];
      
      if (cachedEntry && !this.isExpired(cachedEntry.timestamp)) {
        console.log(`Using cached coordinates for: ${cacheKey.substring(0, 30)}...`);
        return {
          latitude: cachedEntry.latitude,
          longitude: cachedEntry.longitude,
          fromCache: true
        };
      }
    }
    
    // Build full address for geocoding
    const addressParts = [street, city, state, postcode].filter(part => 
      part && part !== 'Address Not Available' && part !== 'City Not Available'
    );
    
    let result: { latitude: number; longitude: number };
    let isGeocoded = false;
    
    if (addressParts.length > 0) {
      const fullAddress = addressParts.join(', ');
      
      try {
        // Try to geocode the full address
        const geocodeResult = await geocodeAddress(fullAddress);
        if (geocodeResult) {
          console.log(`Geocoded and cached: ${fullAddress.substring(0, 50)}...`);
          result = { latitude: geocodeResult.latitude, longitude: geocodeResult.longitude };
          isGeocoded = true;
        } else {
          // Geocoding failed, use fallback
          console.warn(`Geocoding failed for ${fullAddress.substring(0, 50)}..., using fallback`);
          const fallback = getFallbackCoordinates(state);
          result = { latitude: fallback.latitude, longitude: fallback.longitude };
        }
      } catch (error) {
        console.warn(`Geocoding error for ${fullAddress.substring(0, 50)}..., using fallback`);
        const fallback = getFallbackCoordinates(state);
        result = { latitude: fallback.latitude, longitude: fallback.longitude };
      }
    } else {
      // No valid address parts, use fallback
      const fallback = getFallbackCoordinates(state);
      console.log(`Using fallback coordinates for state ${state}`);
      result = { latitude: fallback.latitude, longitude: fallback.longitude };
    }
    
    // Store in cache
    if (this.cache && cacheKey) {
      this.cache.entries[cacheKey] = {
        address: addressParts.join(', '),
        latitude: result.latitude,
        longitude: result.longitude,
        timestamp: new Date().toISOString(),
        isGeocoded
      };
      
      // Save cache (debounced)
      await this.saveCache();
    }
    
    return {
      ...result,
      fromCache: false
    };
  }
  
  /**
   * Batch geocode with caching
   */
  async batchGeocodeWithCache(
    addresses: Array<{ street: string; city: string; state: string; postcode: string }>,
    forceRefresh: boolean = false
  ): Promise<Array<{ latitude: number; longitude: number; fromCache: boolean }>> {
    const results = [];
    let geocodedCount = 0;
    let cachedCount = 0;
    
    console.log(`Starting batch geocoding for ${addresses.length} addresses...`);
    
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const result = await this.getCoordinatesWithCache(
        address.street,
        address.city,
        address.state,
        address.postcode,
        forceRefresh
      );
      
      results.push(result);
      
      if (result.fromCache) {
        cachedCount++;
      } else {
        geocodedCount++;
      }
      
      // Log progress every 50 addresses
      if ((i + 1) % 50 === 0) {
        console.log(`Progress: ${i + 1}/${addresses.length} (${cachedCount} from cache, ${geocodedCount} geocoded)`);
      }
      
      // Add small delay to avoid rate limiting when geocoding
      if (!result.fromCache) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between API calls
      }
    }
    
    console.log(`Batch geocoding complete: ${cachedCount} from cache, ${geocodedCount} newly geocoded`);
    
    // Force final save
    if (geocodedCount > 0 && this.cache) {
      clearTimeout(this.writeDebounceTimer!);
      this.cache.lastUpdated = new Date().toISOString();
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    }
    
    return results;
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    geocodedEntries: number;
    fallbackEntries: number;
    cacheSize: number;
    lastUpdated: string;
  } | null {
    if (!this.cache) return null;
    
    const entries = Object.values(this.cache.entries);
    const geocodedEntries = entries.filter(e => e.isGeocoded).length;
    const fallbackEntries = entries.filter(e => !e.isGeocoded).length;
    
    return {
      totalEntries: entries.length,
      geocodedEntries,
      fallbackEntries,
      cacheSize: JSON.stringify(this.cache).length,
      lastUpdated: this.cache.lastUpdated
    };
  }
  
  /**
   * Clear the cache
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      this.cache = this.createEmptyCache();
      console.log('Geocode cache cleared');
    } catch (error) {
      console.error('Error clearing geocode cache:', error);
    }
  }
  
  /**
   * Export cache to JSON (for debugging or backup)
   */
  async exportCache(): Promise<string | null> {
    if (!this.cache) return null;
    return JSON.stringify(this.cache, null, 2);
  }
  
  /**
   * Import cache from JSON
   */
  async importCache(jsonData: string): Promise<boolean> {
    try {
      const parsedCache = JSON.parse(jsonData) as GeocodeCache;
      if (parsedCache.version === CACHE_VERSION) {
        this.cache = parsedCache;
        await this.saveCache();
        console.log(`Imported ${Object.keys(parsedCache.entries).length} cache entries`);
        return true;
      } else {
        console.error('Cache version mismatch during import');
        return false;
      }
    } catch (error) {
      console.error('Error importing cache:', error);
      return false;
    }
  }
}

// Export singleton instance
const geocodeCacheService = GeocodeCacheService.getInstance();
export default geocodeCacheService;
import type { LatLng } from 'react-native-maps';

/**
 * Safely converts various input types to numbers
 * Handles strings with comma decimals (e.g., "144,9631" -> 144.9631)
 */
const toNumber = (v: any): number => {
  if (typeof v === 'string') {
    // Be tolerant to comma decimals from some exports: "144,9631" -> 144.9631
    const cleaned = v.replace(/,/g, '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }
  return v;
};

/**
 * Normalises any coordinate format into a safe LatLng object
 * Handles multiple input formats and detects common issues
 */
export function normaliseLatLng(c: any): LatLng | null {
  // Accept many possible shapes from different data sources
  // Priority order: direct fields first, then nested structures
  let lat = toNumber(
    c.latitude ?? 
    c.lat ?? 
    c.billingAddress?.latitude ?? 
    c.location?.coordinates?.[1] ??  // GeoJSON format: [lon, lat]
    c.coord?.coordinates?.[1]        // Backend API format: [lon, lat]
  );
  
  let lon = toNumber(
    c.longitude ?? 
    c.lng ?? 
    c.lon ?? 
    c.billingAddress?.longitude ?? 
    c.location?.coordinates?.[0] ??  // GeoJSON format: [lon, lat]
    c.coord?.coordinates?.[0]        // Backend API format: [lon, lat]
  );

  // Missing coordinates? Bail.
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  // Detect swap (e.g., GeoJSON into {latitude, longitude} fields)
  // If latitude looks like longitude (> 90) and longitude looks like latitude (≤ 90), swap them
  // This is common with Australian data where coordinates get swapped during data processing
  if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) {
    console.log(`[COORDS] Detected swapped coordinates, fixing: lat=${lat} -> ${lon}, lon=${lon} -> ${lat}`);
    [lat, lon] = [lon, lat];
  }

  // Final range guard - reject out-of-bounds coordinates
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  return { latitude: lat, longitude: lon };
}

/**
 * Validates if a company has valid coordinates
 * Uses the normaliser to ensure consistency
 */
export function hasValidCoords(company: any): boolean {
  return !!normaliseLatLng(company);
}

/**
 * Extracts valid coordinates from an array of companies
 * Filters out companies with invalid coordinates
 */
export function extractValidCoordinates(companies: any[]): LatLng[] {
  return companies
    .map(normaliseLatLng)
    .filter(Boolean) as LatLng[];
}

/**
 * Development helper to diagnose coordinate issues
 * Logs statistics about coordinate validity and common problems
 */
export function diagnoseCoordinates(companies: any[], label: string = 'Companies'): void {
  if (__DEV__) {
    const withAnyCoords = companies.filter(c => 
      c.latitude != null || c.longitude != null ||
      c.lat != null || c.lng != null || c.lon != null || 
      c.location?.coordinates || c.coord?.coordinates
    );
    
    const validCoords = companies.filter(hasValidCoords);
    
    const outOfBounds = companies.filter(c => {
      const lat = toNumber(c.latitude ?? c.lat ?? c.location?.coordinates?.[1] ?? c.coord?.coordinates?.[1]);
      const lon = toNumber(c.longitude ?? c.lng ?? c.lon ?? c.location?.coordinates?.[0] ?? c.coord?.coordinates?.[0]);
      return Number.isFinite(lat) && Number.isFinite(lon) && (Math.abs(lat) > 90 || Math.abs(lon) > 180);
    });
    
    const likelySwapped = companies.filter(c => {
      const lat = toNumber(c.latitude ?? c.lat ?? c.location?.coordinates?.[1] ?? c.coord?.coordinates?.[1]);
      const lon = toNumber(c.longitude ?? c.lng ?? c.lon ?? c.location?.coordinates?.[0] ?? c.coord?.coordinates?.[0]);
      return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) > 90 && Math.abs(lon) <= 90;
    });
    
    console.log(`[COORDS DIAGNOSTIC] ${label}:`);
    console.log(`  Total: ${companies.length}`);
    console.log(`  With any coords: ${withAnyCoords.length}`);
    console.log(`  Valid coords: ${validCoords.length}`);
    console.log(`  Out of bounds: ${outOfBounds.length}`);
    console.log(`  Likely swapped: ${likelySwapped.length}`);
    
    if (outOfBounds.length > 0) {
      console.log(`  Sample out-of-bounds:`, outOfBounds.slice(0, 3).map(c => ({
        name: c.name,
        lat: c.latitude ?? c.lat ?? c.location?.coordinates?.[1] ?? c.coord?.coordinates?.[1],
        lon: c.longitude ?? c.lng ?? c.lon ?? c.location?.coordinates?.[0] ?? c.coord?.coordinates?.[0]
      })));
    }
    
    if (likelySwapped.length > 0) {
      console.log(`  Sample swapped:`, likelySwapped.slice(0, 3).map(c => ({
        name: c.name,
        lat: c.latitude ?? c.lat ?? c.location?.coordinates?.[1] ?? c.coord?.coordinates?.[1],
        lon: c.longitude ?? c.lng ?? c.lon ?? c.location?.coordinates?.[0] ?? c.coord?.coordinates?.[0]
      })));
    }
  }
}

// utils/geoQuery.ts - Geographic Query Utilities
// Prevents 500 errors by limiting query window sizes

// Configuration constants
const MAX_DELTA = 10;   // Maximum query range in degrees
const MIN_DELTA = 1;    // Minimum 1 degree (backend requires integers)

// Utility function to clamp values between bounds
const clamp = (v: number, lo: number, hi: number) => 
  Math.max(lo, Math.min(hi, v));

/**
 * Clamp query box to safe geographic limits
 * Prevents backend 500 errors from oversized queries
 * Returns integer values for backend compatibility
 * Special case: (0,0,0,0) bypasses clamping for worldwide queries
 * 
 * @param box Query box with location and size parameters
 * @returns Clamped query box within safe limits (integers)
 */
export function clampQueryBox(box: {
  locationX: number;
  locationY: number;
  lenX: number;
  lenY: number;
}) {
  // Special case: (0,0,0,0) for worldwide queries - don't clamp
  if (box.locationX === 0 && box.locationY === 0 && box.lenX === 0 && box.lenY === 0) {
    return {
      locationX: 0,
      locationY: 0,
      lenX: 0,
      lenY: 0
    };
  }

  return {
    // Round to integers for backend compatibility
    locationX: Math.round(clamp(box.locationX, -179.99, 179.99)),
    locationY: Math.round(clamp(box.locationY, -89.99, 89.99)),
    lenX: Math.round(clamp(box.lenX, MIN_DELTA, MAX_DELTA)),
    lenY: Math.round(clamp(box.lenY, MIN_DELTA, MAX_DELTA))
  };
}

// Worldwide query box (covers entire globe)
// Use (0,0,0,0) to get all organizations without geographic filtering
export const WORLDWIDE_QUERY_BOX = {
  locationX: 0,      // Special value for all organizations
  locationY: 0,      // Special value for all organizations
  lenX: 0,           // Special value for all organizations
  lenY: 0            // Special value for all organizations
};

// Victoria bounding box (covers Melbourne + regional VIC)
export const VIC_QUERY_BOX = {
  locationX: 141,    // Bottom-left longitude (integer)
  locationY: -39,    // Bottom-left latitude (integer)
  lenX: 6,           // Width: 141 to 147 degrees
  lenY: 6            // Height: -39 to -33 degrees
};

// Melbourne focused (smaller, more precise)
export const MELBOURNE_QUERY_BOX = {
  locationX: 144,    // Melbourne center-ish
  locationY: -38,
  lenX: 2,
  lenY: 2
};

// Export as default for initial load - use worldwide to get all companies
export const DEFAULT_QUERY_BOX = WORLDWIDE_QUERY_BOX;

/**
 * Compute bounding box from loaded companies
 * Auto-centers query to actual data location
 */
export function bboxFromCompanies(companies: Array<{latitude?: number, longitude?: number}>) {
  const validCoords = companies
    .filter(c => c.latitude && c.longitude)
    .map(c => [c.longitude!, c.latitude!]);
  
  if (validCoords.length === 0) return DEFAULT_QUERY_BOX;
  
  let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
  for (const [lon, lat] of validCoords) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  
  return clampQueryBox({
    locationX: Math.floor(minLon),
    locationY: Math.floor(minLat),
    lenX: Math.ceil(maxLon - minLon),
    lenY: Math.ceil(maxLat - minLat)
  });
}

export { MAX_DELTA, MIN_DELTA };
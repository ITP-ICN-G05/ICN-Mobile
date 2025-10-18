import { normaliseLatLng, hasValidCoords, extractValidCoordinates } from '../coords';

describe('coords utility', () => {
  describe('normaliseLatLng', () => {
    it('should accept standard RN Maps format', () => {
      const result = normaliseLatLng({ latitude: -37.8, longitude: 144.96 });
      expect(result).toEqual({ latitude: -37.8, longitude: 144.96 });
    });

    it('should handle GeoJSON [lon, lat] format', () => {
      const result = normaliseLatLng({ 
        location: { coordinates: [144.96, -37.8] } 
      });
      expect(result).toEqual({ latitude: -37.8, longitude: 144.96 });
    });

    it('should handle backend API coord format', () => {
      const result = normaliseLatLng({ 
        coord: { coordinates: [144.96, -37.8] } 
      });
      expect(result).toEqual({ latitude: -37.8, longitude: 144.96 });
    });

    it('should handle alternative field names', () => {
      const result = normaliseLatLng({ lat: -37.8, lng: 144.96 });
      expect(result).toEqual({ latitude: -37.8, longitude: 144.96 });
    });

    it('should handle billingAddress coordinates', () => {
      const result = normaliseLatLng({ 
        billingAddress: { latitude: -37.8, longitude: 144.96 } 
      });
      expect(result).toEqual({ latitude: -37.8, longitude: 144.96 });
    });

    it('should detect and correct swapped coordinates', () => {
      // When lat looks like longitude (> 90) and lon looks like latitude (≤ 90)
      const result = normaliseLatLng({ latitude: 144.96, longitude: -37.8 });
      expect(result).toEqual({ latitude: -37.8, longitude: 144.96 });
    });

    it('should handle string coordinates with comma decimals', () => {
      const result = normaliseLatLng({ 
        latitude: '-37,8136', 
        longitude: '144,9631' 
      });
      expect(result).toEqual({ latitude: -37.8136, longitude: 144.9631 });
    });

    it('should handle string coordinates with dot decimals', () => {
      const result = normaliseLatLng({ 
        latitude: '-37.8136', 
        longitude: '144.9631' 
      });
      expect(result).toEqual({ latitude: -37.8136, longitude: 144.9631 });
    });

    it('should reject out of range latitude', () => {
      const result = normaliseLatLng({ latitude: -120, longitude: 144.96 });
      expect(result).toBeNull();
    });

    it('should reject out of range longitude', () => {
      const result = normaliseLatLng({ latitude: -37.8, longitude: 500 });
      expect(result).toBeNull();
    });

    it('should reject invalid string coordinates', () => {
      const result = normaliseLatLng({ 
        latitude: 'invalid', 
        longitude: '144.96' 
      });
      expect(result).toBeNull();
    });

    it('should reject missing coordinates', () => {
      const result = normaliseLatLng({ name: 'Test Company' });
      expect(result).toBeNull();
    });

    it('should reject null coordinates', () => {
      const result = normaliseLatLng({ 
        latitude: null, 
        longitude: null 
      });
      expect(result).toBeNull();
    });

    it('should reject undefined coordinates', () => {
      const result = normaliseLatLng({ 
        latitude: undefined, 
        longitude: undefined 
      });
      expect(result).toBeNull();
    });

    it('should handle edge case coordinates at boundaries', () => {
      // Valid boundary coordinates
      expect(normaliseLatLng({ latitude: 90, longitude: 180 })).toEqual({ latitude: 90, longitude: 180 });
      expect(normaliseLatLng({ latitude: -90, longitude: -180 })).toEqual({ latitude: -90, longitude: -180 });
      
      // Invalid boundary coordinates
      expect(normaliseLatLng({ latitude: 90.1, longitude: 180 })).toBeNull();
      expect(normaliseLatLng({ latitude: 90, longitude: 180.1 })).toBeNull();
    });
  });

  describe('hasValidCoords', () => {
    it('should return true for valid coordinates', () => {
      expect(hasValidCoords({ latitude: -37.8, longitude: 144.96 })).toBe(true);
    });

    it('should return false for invalid coordinates', () => {
      expect(hasValidCoords({ latitude: -120, longitude: 144.96 })).toBe(false);
    });

    it('should return false for missing coordinates', () => {
      expect(hasValidCoords({ name: 'Test Company' })).toBe(false);
    });
  });

  describe('extractValidCoordinates', () => {
    it('should extract valid coordinates from company array', () => {
      const companies = [
        { name: 'Valid1', latitude: -37.8, longitude: 144.96 },
        { name: 'Invalid', latitude: -120, longitude: 144.96 },
        { name: 'Valid2', latitude: -37.9, longitude: 144.97 },
        { name: 'Missing', name: 'No Coords' }
      ];

      const result = extractValidCoordinates(companies);
      expect(result).toEqual([
        { latitude: -37.8, longitude: 144.96 },
        { latitude: -37.9, longitude: 144.97 }
      ]);
    });

    it('should return empty array for no valid coordinates', () => {
      const companies = [
        { name: 'Invalid1', latitude: -120, longitude: 144.96 },
        { name: 'Invalid2', latitude: -37.8, longitude: 500 },
        { name: 'Missing', name: 'No Coords' }
      ];

      const result = extractValidCoordinates(companies);
      expect(result).toEqual([]);
    });

    it('should handle empty array', () => {
      const result = extractValidCoordinates([]);
      expect(result).toEqual([]);
    });
  });
});



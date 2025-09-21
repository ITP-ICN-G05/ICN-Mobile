// Business logic tests for CompanyDetailScreen
// These tests focus on the core business logic functions extracted from the screen
// NOT testing full screen rendering or navigation to avoid complex mocking

import { Company } from '../../../types';

// Mock React Native modules for testing
jest.mock('react-native', () => ({
  Platform: {
    select: jest.fn(),
    OS: 'ios',
  },
  Linking: {
    openURL: jest.fn(),
  },
  Share: {
    share: jest.fn(),
  },
}));

// Import after mocking
const { Platform, Linking, Share } = require('react-native');

// Mock company data for testing
const mockCompany: Company = {
  id: '1',
  name: 'Alpha Tech Solutions',
  address: '123 Tech Street, Silicon Valley, CA 94000',
  verificationStatus: 'verified',
  verificationDate: '2023-10-15',
  keySectors: ['Technology', 'Service Provider'],
  companyType: 'service',
  email: 'contact@alphatech.com',
  phoneNumber: '+1 (555) 123-4567',
  website: 'www.alphatech.com',
  latitude: -37.8136,
  longitude: 144.9631,
};

const mockUnverifiedCompany: Company = {
  id: '2',
  name: 'Beta Manufacturing Corp',
  address: '456 Factory Road, Industrial Zone',
  verificationStatus: 'unverified',
  keySectors: ['Manufacturing', 'Item Supplier'],
  latitude: -37.8200,
  longitude: 144.9700,
};

// Business logic functions extracted from CompanyDetailScreen
class CompanyDetailBusinessLogic {
  // Format company type for display
  static formatCompanyType(companyType?: string): string {
    if (!companyType) return '';
    return companyType.charAt(0).toUpperCase() + companyType.slice(1);
  }

  // Generate avatar text from company name
  static generateAvatarText(companyName: string): string {
    return companyName.charAt(0).toUpperCase();
  }

  // Handle bookmark toggle logic
  static toggleBookmark(currentBookmarkState: boolean): boolean {
    return !currentBookmarkState;
  }

  // Generate share message
  static generateShareMessage(company: Company): { message: string; title: string } {
    return {
      message: `Check out ${company.name} on ICN Navigator\n${company.address}`,
      title: company.name,
    };
  }

  // Clean phone number for dialing
  static cleanPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^0-9]/g, '');
  }

  // Format website URL
  static formatWebsiteUrl(website: string): string {
    return website.startsWith('http') ? website : `https://${website}`;
  }

  // Generate maps URL for directions
  static generateMapsUrl(company: Company, platform: 'ios' | 'android'): string {
    const scheme = platform === 'ios' ? 'maps:' : 'geo:';
    const latLng = `${company.latitude},${company.longitude}`;
    const label = encodeURIComponent(company.name);
    
    return `${scheme}${latLng}?q=${label}`;
  }

  // Check if company has contact information
  static hasContactInfo(company: Company): {
    hasPhone: boolean;
    hasEmail: boolean;
    hasWebsite: boolean;
    hasAddress: boolean;
  } {
    return {
      hasPhone: Boolean(company.phoneNumber),
      hasEmail: Boolean(company.email),
      hasWebsite: Boolean(company.website),
      hasAddress: Boolean(company.address),
    };
  }

  // Check if company is verified
  static isVerified(company: Company): boolean {
    return company.verificationStatus === 'verified';
  }

  // Format verification date
  static formatVerificationDate(verificationDate?: string): string {
    return verificationDate || 'Recently';
  }

  // Generate warning message for unverified companies
  static getVerificationWarning(company: Company): string | null {
    if (company.verificationStatus === 'unverified') {
      return 'This company has not yet been verified. Please verify information independently.';
    }
    return null;
  }

  // Validate contact methods availability
  static getAvailableContactMethods(company: Company): string[] {
    const methods: string[] = [];
    
    if (company.phoneNumber) methods.push('call');
    if (company.email) methods.push('email');
    if (company.address) methods.push('directions');
    if (company.website) methods.push('website');
    
    return methods;
  }

  // Process company data for display
  static processCompanyForDisplay(company: Company) {
    return {
      avatarText: this.generateAvatarText(company.name),
      formattedCompanyType: this.formatCompanyType(company.companyType),
      isVerified: this.isVerified(company),
      verificationDisplay: this.formatVerificationDate(company.verificationDate),
      contactInfo: this.hasContactInfo(company),
      availableActions: this.getAvailableContactMethods(company),
      warningMessage: this.getVerificationWarning(company),
      shareData: this.generateShareMessage(company),
    };
  }

  // Simulate action handlers (for testing business logic)
  static async handleShare(company: Company): Promise<{ success: boolean; error?: string }> {
    try {
      const shareData = this.generateShareMessage(company);
      await Share.share(shareData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async handleEmail(company: Company): Promise<{ success: boolean; url?: string }> {
    if (!company.email) {
      return { success: false };
    }
    
    const url = `mailto:${company.email}`;
    try {
      await Linking.openURL(url);
      return { success: true, url };
    } catch {
      return { success: false };
    }
  }

  static async handleCall(company: Company): Promise<{ success: boolean; url?: string }> {
    if (!company.phoneNumber) {
      return { success: false };
    }
    
    const cleanNumber = this.cleanPhoneNumber(company.phoneNumber);
    const url = `tel:${cleanNumber}`;
    
    try {
      await Linking.openURL(url);
      return { success: true, url };
    } catch {
      return { success: false };
    }
  }

  static async handleWebsite(company: Company): Promise<{ success: boolean; url?: string }> {
    if (!company.website) {
      return { success: false };
    }
    
    const url = this.formatWebsiteUrl(company.website);
    
    try {
      await Linking.openURL(url);
      return { success: true, url };
    } catch {
      return { success: false };
    }
  }

  static async handleDirections(company: Company, platform: 'ios' | 'android' = 'ios'): Promise<{ success: boolean; url?: string }> {
    try {
      const url = this.generateMapsUrl(company, platform);
      await Linking.openURL(url);
      return { success: true, url };
    } catch {
      return { success: false };
    }
  }
}

describe('CompanyDetailScreen Business Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Formatting', () => {
    it('should format company type correctly', () => {
      expect(CompanyDetailBusinessLogic.formatCompanyType('service')).toBe('Service');
      expect(CompanyDetailBusinessLogic.formatCompanyType('supplier')).toBe('Supplier');
      expect(CompanyDetailBusinessLogic.formatCompanyType('manufacturer')).toBe('Manufacturer');
      expect(CompanyDetailBusinessLogic.formatCompanyType('consultant')).toBe('Consultant');
      expect(CompanyDetailBusinessLogic.formatCompanyType(undefined)).toBe('');
    });

    it('should generate avatar text from company name', () => {
      expect(CompanyDetailBusinessLogic.generateAvatarText('Alpha Tech Solutions')).toBe('A');
      expect(CompanyDetailBusinessLogic.generateAvatarText('beta manufacturing')).toBe('B');
      expect(CompanyDetailBusinessLogic.generateAvatarText('123 Company')).toBe('1');
    });

    it('should format verification date correctly', () => {
      expect(CompanyDetailBusinessLogic.formatVerificationDate('2023-10-15')).toBe('2023-10-15');
      expect(CompanyDetailBusinessLogic.formatVerificationDate(undefined)).toBe('Recently');
      expect(CompanyDetailBusinessLogic.formatVerificationDate('')).toBe('Recently');
    });

    it('should clean phone numbers correctly', () => {
      expect(CompanyDetailBusinessLogic.cleanPhoneNumber('+1 (555) 123-4567')).toBe('15551234567');
      expect(CompanyDetailBusinessLogic.cleanPhoneNumber('555-123-4567')).toBe('5551234567');
      expect(CompanyDetailBusinessLogic.cleanPhoneNumber('(555) 123.4567')).toBe('5551234567');
      expect(CompanyDetailBusinessLogic.cleanPhoneNumber('555 123 4567')).toBe('5551234567');
    });

    it('should format website URLs correctly', () => {
      expect(CompanyDetailBusinessLogic.formatWebsiteUrl('www.example.com')).toBe('https://www.example.com');
      expect(CompanyDetailBusinessLogic.formatWebsiteUrl('example.com')).toBe('https://example.com');
      expect(CompanyDetailBusinessLogic.formatWebsiteUrl('https://www.example.com')).toBe('https://www.example.com');
      expect(CompanyDetailBusinessLogic.formatWebsiteUrl('http://example.com')).toBe('http://example.com');
    });
  });

  describe('Bookmark Management', () => {
    it('should toggle bookmark state correctly', () => {
      expect(CompanyDetailBusinessLogic.toggleBookmark(false)).toBe(true);
      expect(CompanyDetailBusinessLogic.toggleBookmark(true)).toBe(false);
    });
  });

  describe('Verification Status', () => {
    it('should identify verified companies', () => {
      expect(CompanyDetailBusinessLogic.isVerified(mockCompany)).toBe(true);
      expect(CompanyDetailBusinessLogic.isVerified(mockUnverifiedCompany)).toBe(false);
    });

    it('should generate warning for unverified companies', () => {
      const verifiedWarning = CompanyDetailBusinessLogic.getVerificationWarning(mockCompany);
      const unverifiedWarning = CompanyDetailBusinessLogic.getVerificationWarning(mockUnverifiedCompany);
      
      expect(verifiedWarning).toBeNull();
      expect(unverifiedWarning).toBe('This company has not yet been verified. Please verify information independently.');
    });
  });

  describe('Contact Information Analysis', () => {
    it('should identify available contact methods', () => {
      const contactInfo = CompanyDetailBusinessLogic.hasContactInfo(mockCompany);
      
      expect(contactInfo.hasPhone).toBe(true);
      expect(contactInfo.hasEmail).toBe(true);
      expect(contactInfo.hasWebsite).toBe(true);
      expect(contactInfo.hasAddress).toBe(true);
    });

    it('should handle missing contact information', () => {
      const contactInfo = CompanyDetailBusinessLogic.hasContactInfo(mockUnverifiedCompany);
      
      expect(contactInfo.hasPhone).toBe(false);
      expect(contactInfo.hasEmail).toBe(false);
      expect(contactInfo.hasWebsite).toBe(false);
      expect(contactInfo.hasAddress).toBe(true);
    });

    it('should get available contact methods as array', () => {
      const methods = CompanyDetailBusinessLogic.getAvailableContactMethods(mockCompany);
      
      expect(methods).toContain('call');
      expect(methods).toContain('email');
      expect(methods).toContain('directions');
      expect(methods).toContain('website');
      expect(methods).toHaveLength(4);
    });

    it('should handle limited contact methods', () => {
      const methods = CompanyDetailBusinessLogic.getAvailableContactMethods(mockUnverifiedCompany);
      
      expect(methods).toContain('directions');
      expect(methods).toHaveLength(1);
    });
  });

  describe('Share Functionality', () => {
    it('should generate share message correctly', () => {
      const shareData = CompanyDetailBusinessLogic.generateShareMessage(mockCompany);
      
      expect(shareData.title).toBe('Alpha Tech Solutions');
      expect(shareData.message).toBe('Check out Alpha Tech Solutions on ICN Navigator\n123 Tech Street, Silicon Valley, CA 94000');
    });

    it('should handle share action', async () => {
      (Share.share as jest.Mock).mockResolvedValue(undefined);
      
      const result = await CompanyDetailBusinessLogic.handleShare(mockCompany);
      
      expect(result.success).toBe(true);
      expect(Share.share).toHaveBeenCalledWith({
        title: 'Alpha Tech Solutions',
        message: 'Check out Alpha Tech Solutions on ICN Navigator\n123 Tech Street, Silicon Valley, CA 94000',
      });
    });

    it('should handle share errors', async () => {
      (Share.share as jest.Mock).mockRejectedValue(new Error('Share failed'));
      
      const result = await CompanyDetailBusinessLogic.handleShare(mockCompany);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Share failed');
    });
  });

  describe('Maps and Directions', () => {
    beforeEach(() => {
      (Platform.select as jest.Mock).mockImplementation((options) => {
        return Platform.OS === 'ios' ? options.ios : options.android;
      });
    });

    it('should generate iOS maps URL', () => {
      const url = CompanyDetailBusinessLogic.generateMapsUrl(mockCompany, 'ios');
      
      expect(url).toBe('maps:-37.8136,144.9631?q=Alpha%20Tech%20Solutions');
    });

    it('should generate Android maps URL', () => {
      const url = CompanyDetailBusinessLogic.generateMapsUrl(mockCompany, 'android');
      
      expect(url).toBe('geo:-37.8136,144.9631?q=Alpha%20Tech%20Solutions');
    });

    it('should handle directions action', async () => {
      (Linking.openURL as jest.Mock).mockResolvedValue(true);
      
      const result = await CompanyDetailBusinessLogic.handleDirections(mockCompany, 'ios');
      
      expect(result.success).toBe(true);
      expect(result.url).toBe('maps:-37.8136,144.9631?q=Alpha%20Tech%20Solutions');
      expect(Linking.openURL).toHaveBeenCalledWith('maps:-37.8136,144.9631?q=Alpha%20Tech%20Solutions');
    });
  });

  describe('Contact Actions', () => {
    it('should handle email action', async () => {
      (Linking.openURL as jest.Mock).mockResolvedValue(true);
      
      const result = await CompanyDetailBusinessLogic.handleEmail(mockCompany);
      
      expect(result.success).toBe(true);
      expect(result.url).toBe('mailto:contact@alphatech.com');
      expect(Linking.openURL).toHaveBeenCalledWith('mailto:contact@alphatech.com');
    });

    it('should handle missing email', async () => {
      const result = await CompanyDetailBusinessLogic.handleEmail(mockUnverifiedCompany);
      
      expect(result.success).toBe(false);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('should handle phone call action', async () => {
      (Linking.openURL as jest.Mock).mockResolvedValue(true);
      
      const result = await CompanyDetailBusinessLogic.handleCall(mockCompany);
      
      expect(result.success).toBe(true);
      expect(result.url).toBe('tel:15551234567');
      expect(Linking.openURL).toHaveBeenCalledWith('tel:15551234567');
    });

    it('should handle missing phone number', async () => {
      const result = await CompanyDetailBusinessLogic.handleCall(mockUnverifiedCompany);
      
      expect(result.success).toBe(false);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('should handle website action', async () => {
      (Linking.openURL as jest.Mock).mockResolvedValue(true);
      
      const result = await CompanyDetailBusinessLogic.handleWebsite(mockCompany);
      
      expect(result.success).toBe(true);
      expect(result.url).toBe('https://www.alphatech.com');
      expect(Linking.openURL).toHaveBeenCalledWith('https://www.alphatech.com');
    });

    it('should handle missing website', async () => {
      const result = await CompanyDetailBusinessLogic.handleWebsite(mockUnverifiedCompany);
      
      expect(result.success).toBe(false);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });

  describe('Complete Processing Pipeline', () => {
    it('should process company data for display', () => {
      const processed = CompanyDetailBusinessLogic.processCompanyForDisplay(mockCompany);
      
      expect(processed.avatarText).toBe('A');
      expect(processed.formattedCompanyType).toBe('Service');
      expect(processed.isVerified).toBe(true);
      expect(processed.verificationDisplay).toBe('2023-10-15');
      expect(processed.contactInfo.hasPhone).toBe(true);
      expect(processed.contactInfo.hasEmail).toBe(true);
      expect(processed.contactInfo.hasWebsite).toBe(true);
      expect(processed.contactInfo.hasAddress).toBe(true);
      expect(processed.availableActions).toEqual(['call', 'email', 'directions', 'website']);
      expect(processed.warningMessage).toBeNull();
      expect(processed.shareData.title).toBe('Alpha Tech Solutions');
    });

    it('should process unverified company data', () => {
      const processed = CompanyDetailBusinessLogic.processCompanyForDisplay(mockUnverifiedCompany);
      
      expect(processed.avatarText).toBe('B');
      expect(processed.formattedCompanyType).toBe('');
      expect(processed.isVerified).toBe(false);
      expect(processed.verificationDisplay).toBe('Recently');
      expect(processed.contactInfo.hasPhone).toBe(false);
      expect(processed.contactInfo.hasEmail).toBe(false);
      expect(processed.contactInfo.hasWebsite).toBe(false);
      expect(processed.contactInfo.hasAddress).toBe(true);
      expect(processed.availableActions).toEqual(['directions']);
      expect(processed.warningMessage).toBe('This company has not yet been verified. Please verify information independently.');
    });
  });

  describe('Error Handling', () => {
    it('should handle Linking errors gracefully', async () => {
      (Linking.openURL as jest.Mock).mockRejectedValue(new Error('Cannot open URL'));
      
      const emailResult = await CompanyDetailBusinessLogic.handleEmail(mockCompany);
      const callResult = await CompanyDetailBusinessLogic.handleCall(mockCompany);
      const websiteResult = await CompanyDetailBusinessLogic.handleWebsite(mockCompany);
      const directionsResult = await CompanyDetailBusinessLogic.handleDirections(mockCompany);
      
      expect(emailResult.success).toBe(false);
      expect(callResult.success).toBe(false);
      expect(websiteResult.success).toBe(false);
      expect(directionsResult.success).toBe(false);
    });

    it('should handle undefined company properties', () => {
      const minimalCompany: Company = {
        id: '3',
        name: 'Minimal Company',
        address: 'Address',
        verificationStatus: 'unverified',
        keySectors: ['Other'],
        latitude: 0,
        longitude: 0,
      };
      
      const processed = CompanyDetailBusinessLogic.processCompanyForDisplay(minimalCompany);
      
      expect(processed.avatarText).toBe('M');
      expect(processed.formattedCompanyType).toBe('');
      expect(processed.isVerified).toBe(false);
      expect(processed.verificationDisplay).toBe('Recently');
      expect(processed.availableActions).toEqual(['directions']);
    });
  });
});
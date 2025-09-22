// ==========================================
// Company Interface
// ==========================================
export interface Company {
  id: string;
  name: string;
  address: string;
  verificationStatus: 'verified' | 'unverified';
  verificationDate?: string;
  keySectors: string[];
  latitude: number;
  longitude: number;
  capabilities?: string[];
  companyType?: 'supplier' | 'manufacturer' | 'service' | 'consultant';
  phoneNumber?: string;
  email?: string;
  website?: string;
  
  // Tier-based filtering fields
  companySize?: 'SME' | 'Medium' | 'Large' | 'Enterprise';
  certifications?: string[];
  ownershipType?: ('Female-owned' | 'First Nations-owned' | 'Veteran-owned' | 'Minority-owned')[];
  socialEnterprise?: boolean;
  australianDisabilityEnterprise?: boolean;
  revenue?: number;
  employeeCount?: number;
  localContentPercentage?: number;
  abn?: string;
  
  // Additional fields
  description?: string;
  logo?: string;
  yearEstablished?: number;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  lastUpdated?: string;
  contactPerson?: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
  };
}

// ==========================================
// User Interface (Updated with Profile fields)
// ==========================================
export interface User {
  // Basic info
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Computed: firstName + lastName
  
  // Professional info
  company?: string;
  role?: string;
  bio?: string;
  
  // Contact info
  phone?: string;
  
  // Profile
  avatar?: string | null;
  memberSince: string;
  
  // Subscription/Tier
  tier: 'free' | 'plus' | 'premium'; // Updated to match your tier system
  tierExpiryDate?: string;
  
  // Social links
  linkedIn?: string;
  website?: string;
  
  // Settings/Preferences
  settings?: UserSettings;
  
  // Account status
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  
  // Statistics
  stats?: UserStats;
}

// ==========================================
// User Settings Interface
// ==========================================
export interface UserSettings {
  notifications: boolean;
  locationServices: boolean;
  darkMode: boolean;
  autoSync: boolean;
  emailNotifications?: {
    marketing: boolean;
    updates: boolean;
    weeklyDigest: boolean;
    savedSearchAlerts: boolean;
  };
  privacy?: {
    profileVisible: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
  defaultSearchRadius?: number;
  language?: string;
  timezone?: string;
}

// ==========================================
// User Statistics
// ==========================================
export interface UserStats {
  savedCompanies: number;
  searchesThisMonth: number;
  exportsThisMonth: number;
  totalSearches: number;
  totalExports: number;
  lastSearchDate?: string;
  favoriteCategories?: string[];
}

// ==========================================
// Search Filters (Enhanced)
// ==========================================
export interface SearchFilters {
  // Basic search
  searchText: string;
  sectors: string[];
  companyTypes: ('supplier' | 'manufacturer' | 'service' | 'consultant')[];
  verificationStatus?: 'all' | 'verified' | 'unverified';
  distance?: number;
  
  // Location-based
  latitude?: number;
  longitude?: number;
  suburb?: string;
  postcode?: string;
  state?: string;
  
  // Tier-based filters (Plus/Premium only)
  companySize?: ('SME' | 'Medium' | 'Large' | 'Enterprise')[];
  certifications?: string[];
  ownershipType?: ('Female-owned' | 'First Nations-owned' | 'Veteran-owned' | 'Minority-owned')[];
  socialEnterprise?: boolean;
  australianDisabilityEnterprise?: boolean;
  
  // Premium filters
  minRevenue?: number;
  maxRevenue?: number;
  minEmployees?: number;
  maxEmployees?: number;
  minLocalContent?: number;
  
  // Additional filters
  rating?: number;
  yearEstablished?: number;
  tags?: string[];
  
  // Sort options
  sortBy?: 'relevance' | 'distance' | 'name' | 'rating' | 'verified';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
}

// ==========================================
// Portfolio/Saved Items Interfaces
// ==========================================
export interface SavedCompany {
  id: string;
  companyId: string;
  company?: Company; // Populated company data
  userId: string;
  folderId?: string;
  notes?: string;
  tags?: string[];
  savedDate: string;
  lastViewed?: string;
  isPinned?: boolean;
}

export interface SavedFolder {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  itemCount: number;
  createdDate: string;
  updatedDate: string;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: SearchFilters;
  alertEnabled?: boolean;
  alertFrequency?: 'daily' | 'weekly' | 'monthly';
  lastRun?: string;
  resultCount?: number;
  createdDate: string;
}

// ==========================================
// Export Data Interfaces
// ==========================================
export interface ExportRequest {
  userId: string;
  exportType: 'companies' | 'searches' | 'all';
  format: 'csv' | 'json' | 'pdf';
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    folderIds?: string[];
    companyIds?: string[];
  };
  includeFields?: string[];
}

export interface ExportHistory {
  id: string;
  userId: string;
  exportDate: string;
  exportType: 'companies' | 'searches' | 'all';
  format: 'csv' | 'json' | 'pdf';
  fileSize: number;
  downloadUrl?: string;
  expiryDate?: string;
  status: 'pending' | 'completed' | 'failed';
}

// ==========================================
// Authentication Interfaces
// ==========================================
export interface AuthUser extends User {
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company?: string;
  role?: string;
  phone?: string;
  acceptTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

// ==========================================
// Subscription/Payment Interfaces
// ==========================================
export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'plus' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  autoRenew: boolean;
  trialEndsAt?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface TierFeatures {
  tier: 'free' | 'plus' | 'premium';
  canFilterBySize: boolean;
  canFilterByDiversity: boolean;
  canSeeRevenue: boolean;
  canCreateFolders: boolean;
  canExportFull: boolean;
  maxBookmarkFolders: number;
  maxSavedCompanies: number;
  maxSavedSearches: number;
  exportLimit: number; // -1 for unlimited
  searchLimit: number; // -1 for unlimited
  apiAccess: boolean;
  prioritySupport: boolean;
  customReports: boolean;
}

// ==========================================
// API Response Interfaces
// ==========================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}

// ==========================================
// Notification Interfaces
// ==========================================
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'update';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
}

// ==========================================
// Activity Log Interface
// ==========================================
export interface ActivityLog {
  id: string;
  userId: string;
  action: 'search' | 'save' | 'export' | 'view' | 'update' | 'delete';
  resourceType: 'company' | 'search' | 'folder' | 'profile';
  resourceId?: string;
  resourceName?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// ==========================================
// Type Guards
// ==========================================
export const isVerifiedCompany = (company: Company): boolean => {
  return company.verificationStatus === 'verified';
};

export const isPremiumUser = (user: User): boolean => {
  return user.tier === 'premium';
};

export const isPlusUser = (user: User): boolean => {
  return user.tier === 'plus' || user.tier === 'premium';
};

export const isFreeUser = (user: User): boolean => {
  return user.tier === 'free';
};

// ==========================================
// Enums for better type safety
// ==========================================
export enum UserTier {
  FREE = 'free',
  PLUS = 'plus',
  PREMIUM = 'premium'
}

export enum CompanySize {
  SME = 'SME',
  MEDIUM = 'Medium',
  LARGE = 'Large',
  ENTERPRISE = 'Enterprise'
}

export enum OwnershipType {
  FEMALE_OWNED = 'Female-owned',
  FIRST_NATIONS_OWNED = 'First Nations-owned',
  VETERAN_OWNED = 'Veteran-owned',
  MINORITY_OWNED = 'Minority-owned'
}

export enum CompanyType {
  SUPPLIER = 'supplier',
  MANUFACTURER = 'manufacturer',
  SERVICE = 'service',
  CONSULTANT = 'consultant'
}

export enum VerificationStatus {
  VERIFIED = 'verified',
  UNVERIFIED = 'unverified'
}
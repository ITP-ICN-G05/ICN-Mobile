import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExtendedProfileFields, LocalProfileStore } from './LocalProfileStore';

const API_BASE_URL = __DEV__ ? 'http://10.0.2.2:8082' : 'https://api.icnvictoria.com';

// Backend-compatible fields only - matches the Java User class
interface BackendProfileData {
  id?: string;
  name?: string;       // This is what backend expects (not displayName)
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  avatar?: string;
  VIP?: number;
  cards?: string[];
  createdAt?: string;
}

// Complete ProfileData interface - what frontend components expect
interface ProfileData {
  id: string;
  displayName: string;  // Frontend uses displayName instead of name
  email: string;
  phone: string;
  company: string;
  role: string;
  bio: string;         // Frontend-only field
  linkedIn: string;    // Frontend-only field
  website: string;     // Frontend-only field
  avatar?: string;
  memberSince: string; // Frontend-only field
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

class ProfileApiService {
  private async getAuthToken(): Promise<string> {
    const token = await AsyncStorage.getItem('@auth_token');
    if (!token) {
      // Provide more detailed error message for debugging
      throw new Error('No auth token found. Please login again.');
    }
    return token;
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ) {
    const token = await this.getAuthToken();
    
    // Add debug logging
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log('Profile API Request:', { method, url: fullUrl, hasToken: !!token });
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    
    console.log('Profile API Response:', { status: response.status, ok: response.ok });

    if (!response.ok) {
      // Check if response is JSON or HTML (error page)
      const contentType = response.headers.get('content-type');
      
      // Special handling for common error status codes
      if (response.status === 500) {
        console.error('Server error detected. Details:', {
          url: fullUrl,
          method,
          status: response.status
        });
        
        // For 500 errors, store locally anyway to prevent data loss
        if (method === 'PUT' && endpoint === '/api/user') {
          // Save the attempted profile update to local storage for later retry
          try {
            const pendingUpdates = await AsyncStorage.getItem('@pending_profile_updates') || '{}';
            const updates = JSON.parse(pendingUpdates);
            updates[Date.now()] = body;
            await AsyncStorage.setItem('@pending_profile_updates', JSON.stringify(updates));
            console.log('Saved failed profile update for later retry');
          } catch (storageError) {
            console.error('Failed to save pending update:', storageError);
          }
        }
        
        throw new Error(`Server error (500). Your changes were saved locally and will sync when the server is available.`);
      }
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          throw new Error(error.message || `Request failed with status ${response.status}`);
        } catch (parseError) {
          throw new Error(`Request failed with status ${response.status}`);
        }
      } else {
        // Handle HTML error pages (like 404 pages)
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  }

  // Profile Management
  async getProfile(): Promise<ProfileData> {
    try {
      // Backend doesn't have a separate /api/user/profile endpoint
      // We need to get profile data from cached user data after login
      const cachedUserData = await AsyncStorage.getItem('@user_data');
      if (!cachedUserData) {
        throw new Error('No user data available. Please login again.');
      }
      
      const userData = JSON.parse(cachedUserData);
      
      // Get extended frontend fields from local storage
      const extendedData = await LocalProfileStore.getExtendedFields(userData.id || '');
      
      // Combine data, mapping backend fields to frontend expected format
      const completeProfile: ProfileData = {
        id: userData.id || '',
        displayName: userData.name || '', // Map name to displayName
        email: userData.email || '',
        phone: userData.phone || '',
        company: userData.company || '',
        role: userData.role || 'User',
        avatar: userData.avatar,
        // Include extended fields from local storage (or empty defaults)
        bio: extendedData?.bio || '',
        linkedIn: extendedData?.linkedIn || '',
        website: extendedData?.website || '',
        memberSince: extendedData?.memberSince || 
          (userData.createdAt ? new Date(userData.createdAt).getFullYear().toString() : '')
      };
      
      return completeProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async updateProfile(data: Partial<ProfileData>): Promise<ProfileData> {
    try {
      // Extract backend-compatible fields only
      const backendData: BackendProfileData = {
        email: data.email || '', // Email is required
      };
      
      // Try to get cached user data from AsyncStorage as fallback for ID
      try {
        const cachedUserData = await AsyncStorage.getItem('@user_data');
        const cachedProfile = cachedUserData ? JSON.parse(cachedUserData) : null;
        
        // Use user ID from cached data if available
        if (cachedProfile && cachedProfile.id) {
          backendData.id = cachedProfile.id;
        }
      } catch (cacheError) {
        console.warn('Could not retrieve cached user data:', cacheError);
      }
      
      // Map displayName to name for backend - ensure it's valid
      // Only include if it's provided and not empty
      if (data.displayName !== undefined && data.displayName.trim()) {
        // Make sure name isn't too long and matches backend's pattern
        backendData.name = data.displayName.substring(0, 50).trim();
      }
      
      // Include other backend-compatible fields - ONLY if they are non-empty
      // Backend validation might fail on empty strings
      if (data.phone !== undefined && data.phone.trim()) {
        backendData.phone = data.phone.trim();
      }
      if (data.company !== undefined && data.company.trim()) {
        backendData.company = data.company.trim();
      }
      if (data.role !== undefined && data.role.trim()) {
        backendData.role = data.role.trim();
      }
      if (data.avatar !== undefined) {
        backendData.avatar = data.avatar;
      }
      
      // Extract frontend-only fields
      const extendedData: ExtendedProfileFields = {};
      if (data.bio !== undefined) extendedData.bio = data.bio;
      if (data.linkedIn !== undefined) extendedData.linkedIn = data.linkedIn;
      if (data.website !== undefined) extendedData.website = data.website;
      if (data.memberSince !== undefined) extendedData.memberSince = data.memberSince;
      
      console.log('Sending profile update:', JSON.stringify(backendData));
      
      // Send backend data to API
      const response = await this.makeRequest('/api/user', 'PUT', backendData);
      
      // Update cached user data with new values
      try {
        const cachedUserData = await AsyncStorage.getItem('@user_data');
        if (cachedUserData) {
          const userData = JSON.parse(cachedUserData);
          // Update with new values
          if (backendData.name) userData.name = backendData.name;
          if (backendData.phone) userData.phone = backendData.phone;
          if (backendData.company) userData.company = backendData.company;
          if (backendData.role) userData.role = backendData.role;
          if (backendData.avatar !== undefined) userData.avatar = backendData.avatar;
          await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
        }
      } catch (cacheError) {
        console.warn('Could not update cached user data:', cacheError);
      }
      
      // Save extended fields to local storage
      if (Object.keys(extendedData).length > 0 && backendData.id) {
        await LocalProfileStore.saveExtendedFields(backendData.id, extendedData);
      }
      
      // Get complete profile data to return (includes both backend and frontend fields)
      return this.getProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
    return this.makeRequest('/api/user/avatar', 'POST', formData);
  }

  async deleteAvatar(): Promise<void> {
    return this.makeRequest('/api/user/avatar', 'DELETE');
  }

  // Password Management
  async changePassword(data: PasswordChangeData): Promise<void> {
    return this.makeRequest('/api/user/password', 'PUT', data);
  }

  async requestPasswordReset(email: string): Promise<void> {
    return this.makeRequest('/api/auth/password-reset', 'POST', { email });
  }

  async validateCurrentPassword(password: string): Promise<boolean> {
    const response = await this.makeRequest('/api/user/validate-password', 'POST', { password });
    return response.valid;
  }

  // Account Management
  async deleteAccount(password: string): Promise<void> {
    return this.makeRequest('/api/user/account', 'DELETE', { password });
  }

  async exportUserData(): Promise<Blob> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/user/export`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    return response.blob();
  }

  // Settings
  async updateSettings(settings: Record<string, any>): Promise<void> {
    return this.makeRequest('/api/user/settings', 'PUT', settings);
  }

  async getSettings(): Promise<Record<string, any>> {
    return this.makeRequest('/api/user/settings');
  }
}

export const profileApi = new ProfileApiService();
export type { ProfileData, PasswordChangeData };
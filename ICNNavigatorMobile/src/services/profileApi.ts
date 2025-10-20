import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExtendedProfileFields, LocalProfileStore } from './LocalProfileStore';
import { getApiBaseUrl, fetchWithTimeout } from './apiConfig';

// Complete ProfileData interface matching the User interface
interface ProfileData {
  id: string;  // Added
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  bio: string;
  linkedIn: string;
  website: string;
  avatar?: string;
  memberSince: string;  // Added
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

class ProfileApiService {
  private async getAuthToken(): Promise<string> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('No auth token found');
    return token;
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ) {
    const token = await this.getAuthToken();
    const API_BASE_URL = getApiBaseUrl();
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetchWithTimeout(fullUrl, {
      method,
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Profile Management
  async getProfile(): Promise<ProfileData> {
    return this.makeRequest('/user/profile');
  }

  async updateProfile(data: Partial<ProfileData>): Promise<ProfileData> {
    return this.makeRequest('/user/profile', 'PUT', data);
  }

  async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
    return this.makeRequest('/user/avatar', 'POST', formData);
  }

  async deleteAvatar(): Promise<void> {
    return this.makeRequest('/user/avatar', 'DELETE');
  }

  // Password Management
  async changePassword(data: PasswordChangeData): Promise<void> {
    return this.makeRequest('/user/password', 'PUT', data);
  }

  async requestPasswordReset(email: string): Promise<void> {
    return this.makeRequest('/auth/password-reset', 'POST', { email });
  }

  async validateCurrentPassword(password: string): Promise<boolean> {
    const response = await this.makeRequest('/user/validate-password', 'POST', { password });
    return response.valid;
  }

  // Account Management
  async deleteAccount(password: string): Promise<void> {
    return this.makeRequest('/user/account', 'DELETE', { password });
  }

  async exportUserData(): Promise<Blob> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/user/export`, {
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
    return this.makeRequest('/user/settings', 'PUT', settings);
  }

  async getSettings(): Promise<Record<string, any>> {
    return this.makeRequest('/user/settings');
  }
}

export const profileApi = new ProfileApiService();
export type { ProfileData, PasswordChangeData };
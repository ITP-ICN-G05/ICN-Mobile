// services/apiConfig.ts - API Configuration and Base Service
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_CONFIG = {
  // Development Environment - Based on Backend API Guide
  DEV: {
    // For Android emulator, use 10.0.2.2 to access your computer's localhost
    // For iOS simulator, use localhost
    // If using physical device, replace with your computer's IP address (e.g., 'http://192.168.1.100:8082/api')
    BASE_URL: 'http://10.0.2.2:8082/api',
    TIMEOUT: 10000,
  },
  // Production Environment
  PROD: {
    BASE_URL: 'https://api.icnvictoria.com/api',
    TIMEOUT: 15000,
  }
};

// Get current environment configuration
const getCurrentConfig = () => {
  return __DEV__ ? API_CONFIG.DEV : API_CONFIG.PROD;
};

// HTTP request method enumeration
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

// API response interface
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  success: boolean;
}

// Base API service class
export class BaseApiService {
  private config = getCurrentConfig();

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@auth_token');
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Build request headers
   */
  private async buildHeaders(contentType: string = 'application/json'): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': contentType,
      'Accept': 'application/json',
    };

    const token = await this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    
    if (response.ok) {
      const data = isJson ? await response.json() : await response.text();
      return {
        data,
        status: response.status,
        success: true
      };
    } else {
      // Try to get detailed error message from X-Error header first
      const xError = response.headers.get('X-Error');
      let errorMessage = 'Request failed';
      
      // Use X-Error header if available
      if (xError) {
        errorMessage = xError;
      } else {
        // Otherwise try to parse response body
        try {
          if (isJson) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            if (errorText && errorText.trim().length > 0) {
              errorMessage = errorText;
            }
          }
        } catch (e) {
          // If parsing fails, keep the default error message
          console.warn('Failed to parse error response:', e);
        }
      }
      
      return {
        error: errorMessage,
        status: response.status,
        success: false
      };
    }
  }

  /**
   * Execute HTTP request
   */
  protected async request<T = any>(
    endpoint: string,
    method: HttpMethod = HttpMethod.GET,
    body?: any,
    customHeaders?: HeadersInit
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.config.BASE_URL}${endpoint}`;
      const headers = customHeaders || await this.buildHeaders();
      
      const requestOptions: RequestInit = {
        method,
        headers,
      };

      // Add request body (if not GET request)
      if (method !== HttpMethod.GET && body) {
        if (body instanceof FormData) {
          // For FormData, let browser automatically set Content-Type
          delete (headers as any)['Content-Type'];
          requestOptions.body = body;
        } else {
          requestOptions.body = JSON.stringify(body);
        }
      }

      console.log(`🌐 API ${method} ${url}`, body ? { body } : '');

      const response = await fetch(url, requestOptions);
      const result = await this.handleResponse<T>(response);

      if (result.success) {
        console.log(`✅ API ${method} ${url} - Success`);
      } else {
        console.error(`❌ API ${method} ${url} - Error:`, result.error);
      }

      return result;
    } catch (error: any) {
      console.error(`🚨 API ${method} ${endpoint} - Network Error:`, error);
      return {
        error: error.message || 'Network error occurred',
        status: 0,
        success: false
      };
    }
  }

  /**
   * GET request
   */
  protected get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      url += `?${searchParams.toString()}`;
    }
    return this.request<T>(url, HttpMethod.GET);
  }

  /**
   * POST request
   */
  protected post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HttpMethod.POST, body);
  }

  /**
   * PUT request
   */
  protected put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HttpMethod.PUT, body);
  }

  /**
   * DELETE request
   */
  protected delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HttpMethod.DELETE);
  }
}

export default BaseApiService;
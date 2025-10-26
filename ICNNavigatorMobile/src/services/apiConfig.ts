// services/apiConfig.ts - API Configuration and Base Service
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_CONFIG = {
  // Development Environment - Based on Backend API Guide
  DEV: {
    // For Android emulator, use 10.0.2.2 to access your computer's localhost
    // For iOS simulator, use localhost 172.20.10.12
    // For physical device via WiFi/Hotspot, use your computer's IP address
    // For USB debugging, use 'http://localhost:8082/api' with 'adb reverse tcp:8082 tcp:8082'
    BASE_URL: 'http://54.242.81.107:8080/api', // Mobile Hotspot - Laptop IP when connected to phone's hotspot
    TIMEOUT: 30000, // Increased from 10s to 30s to prevent timeouts during large data loads
  },
  // Production Environment - AWS Backend
  PROD: {
    BASE_URL: 'http://54.242.81.107:8080/api', // AWS EC2 Backend - Using HTTP until HTTPS is configured
    TIMEOUT: 15000,
  }
};

// Get current environment configuration
const getCurrentConfig = () => {
  return __DEV__ ? API_CONFIG.DEV : API_CONFIG.PROD;
};

/**
 * Get API base URL without /api suffix
 * Useful for services that need direct backend access (e.g., bookmarkService, profileApi)
 * @returns Base URL (e.g., 'http://10.0.2.2:8082' or 'https://api.icnvictoria.com')
 */
export const getApiBaseUrl = (): string => {
  const config = getCurrentConfig();
  // Remove '/api' suffix if present
  return config.BASE_URL.replace(/\/api$/, '');
};

/**
 * Get API timeout configuration
 * @returns Timeout in milliseconds (30000 for dev, 15000 for prod)
 */
export const getApiTimeout = (): number => {
  return getCurrentConfig().TIMEOUT;
};

/**
 * Fetch with automatic timeout handling
 * Wraps native fetch with AbortController for timeout support
 * @param url Request URL
 * @param options Fetch options
 * @param timeout Custom timeout (optional, uses config default if not provided)
 * @returns Promise resolving to Response
 * @throws TypeError on timeout or network error
 */
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout?: number
): Promise<Response> => {
  const timeoutMs = timeout || getApiTimeout();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`⏰ Request timeout after ${timeoutMs}ms for URL: ${url}`);
    console.error(`💡 This might be due to large data size. Consider reducing the limit parameter.`);
    controller.abort();
  }, timeoutMs);

  try {
    console.log(`🚀 Initiating fetch request to: ${url}`);
    console.log(`🔧 Request options:`, {
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body ? 'Present' : 'None'
    });
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log(`✅ Fetch completed for: ${url}`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`❌ Fetch failed for: ${url}`, {
      error: error.message,
      name: error.name,
      cause: error.cause,
      aborted: error.name === 'AbortError'
    });
    throw error;
  }
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
      // Read X-Error header first (backend's custom error)
      const xError = response.headers.get('X-Error') || response.headers.get('x-error');
      let errorMessage = 'Request failed';
      
      // Priority 1: X-Error header
      if (xError) {
        errorMessage = xError;
      } else {
        // Priority 2: Response body
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
          console.warn('Failed to parse error response:', e);
        }
      }
      
      // Add status code for debugging
      const detailedError = `${errorMessage} (HTTP ${response.status})`;
      
      return {
        error: detailedError,
        status: response.status,
        success: false
      };
    }
  }

  /**
   * Execute HTTP request with timeout support
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
      console.log(`🔧 Request options:`, {
        method: requestOptions.method,
        headers: requestOptions.headers,
        timeout: this.config.TIMEOUT,
        hasBody: !!requestOptions.body
      });

      // Use fetchWithTimeout instead of regular fetch to prevent timeouts
      console.log(`📡 Sending request to server...`);
      const response = await fetchWithTimeout(url, requestOptions, this.config.TIMEOUT);
      console.log(`📨 Response received:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
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
            // Debug: Log parameter values before adding to URLSearchParams
            if (key === 'email') {
              console.log('🔍 Adding email to URLSearchParams:', JSON.stringify(value));
              console.log('🔍 Email type:', typeof value);
            }
            searchParams.append(key, String(value));
          }
        }
      });
      url += `?${searchParams.toString()}`;
      console.log('🔍 Final URL:', url);
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
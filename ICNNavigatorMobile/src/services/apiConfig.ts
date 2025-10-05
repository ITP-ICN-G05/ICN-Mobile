// services/apiConfig.ts - API配置和基础服务
import AsyncStorage from '@react-native-async-storage/async-storage';

// API配置
export const API_CONFIG = {
  // 开发环境 - 根据您的后端API指南设置
  DEV: {
    // 对于Android模拟器，使用 10.0.2.2 来访问您电脑的localhost
    // 如果您使用物理设备，请替换为您的电脑IP地址 (例如 'http://192.168.1.100:8082/api')
    BASE_URL: 'http://10.0.2.2:8082/api',
    TIMEOUT: 10000,
  },
  // 生产环境
  PROD: {
    BASE_URL: 'https://api.icnvictoria.com/api',
    TIMEOUT: 15000,
  }
};

// 获取当前环境配置
const getCurrentConfig = () => {
  return __DEV__ ? API_CONFIG.DEV : API_CONFIG.PROD;
};

// HTTP请求方法枚举
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

// API响应接口
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  success: boolean;
}

// 基础API服务类
export class BaseApiService {
  private config = getCurrentConfig();

  /**
   * 获取认证令牌
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
   * 构建请求头
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
   * 处理API响应
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
      const errorText = isJson ? 
        (await response.json()).message || 'Request failed' :
        await response.text() || 'Request failed';
      
      return {
        error: errorText,
        status: response.status,
        success: false
      };
    }
  }

  /**
   * 执行HTTP请求
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

      // 添加请求体（如果不是GET请求）
      if (method !== HttpMethod.GET && body) {
        if (body instanceof FormData) {
          // FormData情况下，让浏览器自动设置Content-Type
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
   * GET请求
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
   * POST请求
   */
  protected post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HttpMethod.POST, body);
  }

  /**
   * PUT请求
   */
  protected put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HttpMethod.PUT, body);
  }

  /**
   * DELETE请求
   */
  protected delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HttpMethod.DELETE);
  }
}

export default BaseApiService;
# ICN Mobile API Connection Setup and Testing Guide

## 📋 Overview

This guide will help you set up the correct connection between ICN Mobile frontend and backend API, and provide a complete testing workflow. Based on the backend API guide and mobile analysis, we have fixed the API configuration inconsistencies.

## 🔧 Fixed Configuration Issues

### 1. Unified API Base URL
- ✅ Updated `src/constants/index.ts` from port 8080 to 8082
- ✅ Fixed hardcoded URLs in `src/services/authService.ts`
- ✅ Updated `src/services/organisationApiService.ts` to match backend API parameters

### 2. Fixed Service Files
- `src/constants/index.ts` - Unified API base URL
- `src/services/apiConfig.ts` - Updated development environment configuration
- `src/services/authService.ts` - Uses unified API configuration
- `src/services/organisationApiService.ts` - Matches backend API parameter format

## 🚀 Startup Guide

### Prerequisites
1. **Backend Service Running**: Ensure ICN Backend is running at `http://localhost:8082`
2. **MongoDB Running**: Ensure MongoDB container is running
3. **Docker Environment**: Ensure Docker and Docker Compose are available

### Step 1: Start Backend Service

```bash
# 1. Start MongoDB
cd ICN-Backend/infra/mongo
docker-compose up -d

# 2. Start backend API service
cd ICN-Backend
mvn spring-boot:run
```

**Verify Backend Service**:
```bash
# Test API connection
curl http://localhost:8082/api/user/getCode?email=test@example.com
# Should return 202 Accepted or 400 Bad Request (normal)
```

### Step 2: Configure Mobile Environment

#### 2.1 Update Environment Variables
In `ICNNavigatorMobile/.env` file:

```env
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:8082/api

# Google Maps API (Required)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Development Configuration
NODE_ENV=development
EXPO_NO_TELEMETRY=1
```

#### 2.2 Platform-Specific Configuration

**Android Emulator**:
```typescript
// Use 10.0.2.2 to access host machine's localhost
BASE_URL: 'http://10.0.2.2:8082/api'
```

**iOS Simulator**:
```typescript
// Use localhost
BASE_URL: 'http://localhost:8082/api'
```

**Physical Device**:
```typescript
// Use your computer's IP address
BASE_URL: 'http://192.168.1.100:8082/api'  // Replace with actual IP
```

### Step 3: Start Mobile Application

```bash
# Enter mobile project
cd ICN-Mobile

# Start development environment
make dev

# Or start Expo directly
make start
```

## 🧪 API Connection Testing

### Test 1: Basic Connection Test

We created an API integration test component to verify connections:

```typescript
// Add test component in your app
import { ApiIntegrationTest } from './src/components/ApiIntegrationTest';

// Render in your test screen
<ApiIntegrationTest />
```

### Test 2: User API Testing

#### 2.1 Send Validation Code Test
```typescript
import { userApiService } from './src/services/userApiService';

const testSendCode = async () => {
  try {
    const response = await userApiService.sendValidationCode('test@example.com');
    console.log('Validation code send result:', response);
    // Should return success: true, status: 202
  } catch (error) {
    console.error('Validation code send failed:', error);
  }
};
```

#### 2.2 User Login Test
```typescript
const testLogin = async () => {
  try {
    const response = await userApiService.login('test@example.com', 'password');
    console.log('Login result:', response);
    // Returns user data on success, error message on failure
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Test 3: Organisation API Testing

#### 3.1 Search Organisations Test
```typescript
import { organisationApiService } from './src/services/organisationApiService';

const testSearchOrganisations = async () => {
  try {
    const response = await organisationApiService.searchOrganisationsWithErrorHandling(
      0,    // locationX
      0,    // locationY
      100,  // lenX
      100,  // lenY
      { sector: 'technology' }, // filters
      'software', // searchText
      { skip: 0, limit: 10 } // pagination
    );
    console.log('Search results:', response);
    // Should return organisation list
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

#### 3.2 Get Organisation Details Test
```typescript
const testGetOrganisationDetails = async () => {
  try {
    const response = await organisationApiService.getOrganisationDetailsWithErrorHandling(
      'org123',  // organisationId
      'user456'  // userId
    );
    console.log('Organisation details:', response);
    // Should return organisation details
  } catch (error) {
    console.error('Get details failed:', error);
  }
};
```

## 🔍 Debugging and Troubleshooting

### Common Issues and Solutions

#### 1. Connection Refused
```
Error: Network request failed
```

**Solution**:
- Check if backend service is running at `http://localhost:8082`
- Verify MongoDB container is running
- Check firewall settings

#### 2. Android Emulator Cannot Connect
```
Error: Network request failed on Android
```

**Solution**:
- Ensure using `10.0.2.2:8082` instead of `localhost:8082`
- Check Android emulator network settings
- Restart Android emulator

#### 3. iOS Simulator Connection Issues
```
Error: Network request failed on iOS
```

**Solution**:
- Ensure using `localhost:8082`
- Check macOS firewall settings
- Restart iOS simulator

#### 4. Physical Device Connection Issues
```
Error: Network request failed on physical device
```

**Solution**:
- Use your computer's actual IP address (e.g., `192.168.1.100:8082`)
- Ensure device and computer are on same Wi-Fi network
- Check router settings

### Debugging Tools

#### 1. Network Request Logs
```typescript
// Enable detailed logs in apiConfig.ts
console.log(`🌐 API ${method} ${url}`, body ? { body } : '');
console.log(`✅ API ${method} ${url} - Success`);
console.error(`❌ API ${method} ${url} - Error:`, result.error);
```

#### 2. Using React Native Debugger
```bash
# Install React Native Debugger
npm install -g react-native-debugger

# Start debugger
react-native-debugger
```

#### 3. Using Flipper
```bash
# Install Flipper
# Download and install Flipper desktop app
# Enable Flipper plugins in your app
```

## 📱 Platform-Specific Configuration

### Android Configuration

#### 1. Network Security Configuration
In `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.1.100</domain>
    </domain-config>
</network-security-config>
```

#### 2. Update AndroidManifest.xml
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ... >
```

### iOS Configuration

#### 1. Update Info.plist
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>localhost</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

## 🧪 Complete Testing Workflow

### Test Script
Create a test script to verify all API connections:

```typescript
// src/utils/apiTestSuite.ts
import { userApiService } from '../services/userApiService';
import { organisationApiService } from '../services/organisationApiService';

export const runApiTestSuite = async () => {
  console.log('🧪 Starting API test suite...');
  
  // Test 1: Send validation code
  console.log('📧 Testing send validation code...');
  try {
    const codeResponse = await userApiService.sendValidationCode('test@example.com');
    console.log('✅ Validation code test passed:', codeResponse.status);
  } catch (error) {
    console.error('❌ Validation code test failed:', error);
  }
  
  // Test 2: Search organisations
  console.log('🔍 Testing search organisations...');
  try {
    const searchResponse = await organisationApiService.searchOrganisationsWithErrorHandling(
      0, 0, 100, 100, {}, '', { skip: 0, limit: 5 }
    );
    console.log('✅ Search test passed:', searchResponse.length, 'results');
  } catch (error) {
    console.error('❌ Search test failed:', error);
  }
  
  // Test 3: Get organisation details
  console.log('📋 Testing get organisation details...');
  try {
    const detailResponse = await organisationApiService.getOrganisationDetailsWithErrorHandling(
      'test-org-id', 'test-user-id'
    );
    console.log('✅ Details test passed:', detailResponse ? 'has data' : 'no data');
  } catch (error) {
    console.error('❌ Details test failed:', error);
  }
  
  console.log('🎉 API test suite completed!');
};
```

### Using Test Suite in App
```typescript
// In your test screen
import { runApiTestSuite } from '../utils/apiTestSuite';

const TestScreen = () => {
  const handleRunTests = () => {
    runApiTestSuite();
  };
  
  return (
    <View>
      <Button title="Run API Tests" onPress={handleRunTests} />
    </View>
  );
};
```

## 📊 Performance Monitoring

### 1. API Response Time Monitoring
```typescript
// Add performance monitoring in apiConfig.ts
const startTime = Date.now();
const response = await fetch(url, requestOptions);
const endTime = Date.now();
console.log(`⏱️ API response time: ${endTime - startTime}ms`);
```

### 2. Error Rate Statistics
```typescript
// Add error statistics
let errorCount = 0;
let totalRequests = 0;

// Update statistics after request completion
totalRequests++;
if (!response.ok) {
  errorCount++;
}
console.log(`📊 Error rate: ${(errorCount / totalRequests * 100).toFixed(2)}%`);
```

## 🎯 Next Steps

1. **Complete Hybrid Data Service**: Integrate local data as backup for API
2. **Implement All TODO Items**: Complete user registration, file upload, etc.
3. **Add More Tests**: Increase unit tests and integration tests
4. **Performance Optimization**: Implement request caching and offline support
5. **Error Handling Improvements**: Add retry mechanisms and better error messages

## 📞 Support

If you encounter issues, please:
1. Check console logs
2. Verify network connection
3. Confirm backend service status
4. Review troubleshooting section in this guide

---

**Note**: This guide is based on current backend API implementation. If backend API is updated, please update frontend configuration accordingly.
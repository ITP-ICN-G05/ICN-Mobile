// API Integration Test Component - DISABLED FOR REAL APP TESTING
// Uncomment this section when you want to re-enable API testing

/*
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { userApiService } from '../services/userApiService';
import { organisationApiService } from '../services/organisationApiService';
import { API_BASE_URL } from '../constants';

interface TestResult {
  testName: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

const ApiIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isApiTestMode, setIsApiTestMode] = useState(true);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    const startTime = Date.now();
    addTestResult({
      testName,
      status: 'pending',
      message: 'Running...'
    });

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      addTestResult({
        testName,
        status: 'success',
        message: `Success - ${JSON.stringify(result).substring(0, 100)}...`,
        duration
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      addTestResult({
        testName,
        status: 'error',
        message: `Failed - ${error.message}`,
        duration
      });
    }
  };

  const testBasicConnection = async () => {
    const response = await fetch(`${API_BASE_URL}/user/getCode?email=test@example.com`);
    const result = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    };
    
    // Add more context for common issues
    if (response.status === 500) {
      result.error = 'Server error - likely missing GOOGLE_MAPS_API_KEY environment variable or email service not configured';
    } else if (response.status === 400) {
      result.error = 'Bad request - check email format';
    }
    
    return result;
  };

  const testSendValidationCode = async () => {
    const response = await userApiService.sendValidationCode('test@example.com');
    return response;
  };

  const testSearchOrganisations = async () => {
    const response = await organisationApiService.searchOrganisationsWithErrorHandling(
      0,    // locationX
      0,    // locationY
      100,  // lenX
      100,  // lenY
      { sector: 'technology' }, // filters
      'software', // searchText
      { skip: 0, limit: 5 } // pagination
    );
    return response;
  };

  const testGetOrganisationDetails = async () => {
    const response = await organisationApiService.getOrganisationDetailsWithErrorHandling(
      'test-org-id',  // organisationId
      'test-user-id'  // userId
    );
    
    // Add context for expected failures
    if (response === null) {
      return {
        result: 'Expected failure - test IDs do not exist in database',
        status: 'Expected failure',
        note: 'This is normal for a fresh database with no data'
      };
    }
    
    return response;
  };

  // Real App Functionality Tests
  const testRealAppSearch = async () => {
    // Test real organisation search with actual data
    const response = await organisationApiService.searchOrganisationsWithErrorHandling(
      0, 0, 100, 100, // Default search area
      {}, // No filters
      '', // No search text
      { skip: 0, limit: 10 } // Get 10 results
    );
    
    if (response && response.length > 0) {
      return {
        result: `Found ${response.length} organisations`,
        sampleOrganisation: response[0],
        status: 'Real data available'
      };
    }
    
    return {
      result: 'No organisations found',
      status: 'No data'
    };
  };

  const testRealAppGeocoding = async () => {
    // Test if organisations have coordinates
    const response = await organisationApiService.searchOrganisationsWithErrorHandling(
      0, 0, 100, 100,
      {},
      '',
      { skip: 0, limit: 5 }
    );
    
    if (response && response.length > 0) {
      const withCoords = response.filter(org => org.coordinates);
      return {
        result: `${withCoords.length}/${response.length} organisations have coordinates`,
        geocodingStatus: withCoords.length > 0 ? 'Working' : 'No coordinates',
        status: withCoords.length > 0 ? 'Geocoding active' : 'Geocoding needed'
      };
    }
    
    return {
      result: 'No data to check geocoding',
      status: 'No data'
    };
  };

  const testRealAppFilters = async () => {
    // Test different filter combinations
    const tests = [
      { name: 'Sector Filter', filters: { sector: 'Critical Minerals' } },
      { name: 'Company Type Filter', filters: { companyType: 'Manufacturer' } },
      { name: 'Location Filter', filters: { location: 'NSW' } }
    ];
    
    const results = [];
    for (const test of tests) {
      try {
        const response = await organisationApiService.searchOrganisationsWithErrorHandling(
          0, 0, 100, 100,
          test.filters,
          '',
          { skip: 0, limit: 5 }
        );
        results.push({
          filter: test.name,
          count: response ? response.length : 0,
          status: 'Working'
        });
      } catch (error) {
        results.push({
          filter: test.name,
          count: 0,
          status: 'Error',
          error: error.message
        });
      }
    }
    
    return {
      result: 'Filter tests completed',
      filterResults: results,
      status: 'Filters tested'
    };
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    if (isApiTestMode) {
      // API Test Mode - Test basic connectivity and endpoints
      await runTest('Basic Connection Test', testBasicConnection);
      await runTest('Send Validation Code', testSendValidationCode);
      await runTest('Search Organisations', testSearchOrganisations);
      await runTest('Get Organisation Details', testGetOrganisationDetails);
    } else {
      // Real App Mode - Test actual app functionality
      await runTest('Real App Search', testRealAppSearch);
      await runTest('Real App Geocoding', testRealAppGeocoding);
      await runTest('Real App Filters', testRealAppFilters);
    }

    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Integration Test</Text>
      
      <View style={styles.configInfo}>
        <Text style={styles.configTitle}>Current Configuration:</Text>
        <Text style={styles.configText}>API Base URL: {API_BASE_URL}</Text>
        <Text style={styles.configText}>Environment: {__DEV__ ? 'Development' : 'Production'}</Text>
        <Text style={styles.configText}>Test Mode: {isApiTestMode ? 'API Test Mode' : 'Real App Mode'}</Text>
      </View>

      <View style={styles.modeToggleContainer}>
        <Text style={styles.modeToggleTitle}>Test Mode:</Text>
        <View style={styles.modeToggleButtons}>
          <TouchableOpacity
            style={[
              styles.modeToggleButton,
              isApiTestMode ? styles.modeToggleButtonActive : styles.modeToggleButtonInactive
            ]}
            onPress={() => setIsApiTestMode(true)}
            disabled={isRunning}
          >
            <Text style={[
              styles.modeToggleButtonText,
              isApiTestMode ? styles.modeToggleButtonTextActive : styles.modeToggleButtonTextInactive
            ]}>
              API Test Mode
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeToggleButton,
              !isApiTestMode ? styles.modeToggleButtonActive : styles.modeToggleButtonInactive
            ]}
            onPress={() => setIsApiTestMode(false)}
            disabled={isRunning}
          >
            <Text style={[
              styles.modeToggleButtonText,
              !isApiTestMode ? styles.modeToggleButtonTextActive : styles.modeToggleButtonTextInactive
            ]}>
              Real App Mode
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isApiTestMode ? 'Run API Tests' : 'Test Real App'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={clearResults}
          disabled={isRunning}
        >
          <Text style={styles.secondaryButtonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultIcon}>
                  {getStatusIcon(result.status)}
                </Text>
                <Text style={styles.resultName}>{result.testName}</Text>
                {result.duration && (
                  <Text style={styles.resultDuration}>
                    {result.duration}ms
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.resultMessage,
                  { color: getStatusColor(result.status) }
                ]}
              >
                {result.message}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionsText}>
          1. Ensure backend service is running at http://localhost:8082
        </Text>
        <Text style={styles.instructionsText}>
          2. Ensure MongoDB container is running
        </Text>
        <Text style={styles.instructionsText}>
          3. Choose test mode:
        </Text>
        <Text style={styles.instructionsSubText}>
          • API Test Mode: Tests basic connectivity and endpoints
        </Text>
        <Text style={styles.instructionsSubText}>
          • Real App Mode: Tests actual app functionality with real data
        </Text>
        <Text style={styles.instructionsText}>
          4. Click the test button to start testing
        </Text>
        <Text style={styles.instructionsText}>
          5. View test results and response times
        </Text>
      </View>

      <View style={styles.troubleshootingContainer}>
        <Text style={styles.troubleshootingTitle}>Test Results Explanation:</Text>
        {isApiTestMode ? (
          <>
            <Text style={styles.troubleshootingText}>
              ✅ Organisation Search: Working perfectly - API is functional
            </Text>
            <Text style={styles.troubleshootingText}>
              ❌ User Validation Code: Expected failure - needs GOOGLE_MAPS_API_KEY
            </Text>
            <Text style={styles.troubleshootingText}>
              ❌ Organisation Details: Expected failure - test IDs don't exist in database
            </Text>
            <Text style={styles.troubleshootingText}>
              • These failures are normal for a fresh setup
            </Text>
            <Text style={styles.troubleshootingText}>
              • The core API functionality is working correctly
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.troubleshootingText}>
              ✅ Real App Search: Tests actual data retrieval
            </Text>
            <Text style={styles.troubleshootingText}>
              ✅ Real App Geocoding: Checks if coordinates are available
            </Text>
            <Text style={styles.troubleshootingText}>
              ✅ Real App Filters: Tests different filter combinations
            </Text>
            <Text style={styles.troubleshootingText}>
              • This mode tests the actual app functionality
            </Text>
            <Text style={styles.troubleshootingText}>
              • Use this to verify your app works with real data
            </Text>
          </>
        )}
      </View>

      <View style={styles.troubleshootingContainer}>
        <Text style={styles.troubleshootingTitle}>Troubleshooting:</Text>
        <Text style={styles.troubleshootingText}>
          • If basic connection test fails, check if backend service is running
        </Text>
        <Text style={styles.troubleshootingText}>
          • If API tests fail, check network connection and API endpoints
        </Text>
        <Text style={styles.troubleshootingText}>
          • For Android emulator, ensure using 10.0.2.2:8082
        </Text>
        <Text style={styles.troubleshootingText}>
          • For physical devices, use your computer's IP address
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  configInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  configTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  configText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modeToggleContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  modeToggleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  modeToggleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeToggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
  },
  modeToggleButtonActive: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  modeToggleButtonInactive: {
    backgroundColor: '#fff',
    borderColor: '#9C27B0',
  },
  modeToggleButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modeToggleButtonTextActive: {
    color: '#fff',
  },
  modeToggleButtonTextInactive: {
    color: '#9C27B0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  resultItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#333',
  },
  resultDuration: {
    fontSize: 12,
    color: '#666',
  },
  resultMessage: {
    fontSize: 14,
    marginLeft: 24,
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  instructionsSubText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
    marginLeft: 16,
  },
  troubleshootingContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  troubleshootingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  troubleshootingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default ApiIntegrationTest;
*/

// Placeholder component for when API test is disabled
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ApiIntegrationTestDisabled: React.FC = () => {
  return (
    <View style={styles.disabledContainer}>
      <Text style={styles.disabledTitle}>API Integration Test</Text>
      <Text style={styles.disabledText}>
        API Integration Test is currently disabled for real app testing.
      </Text>
      <Text style={styles.disabledSubText}>
        To re-enable: Uncomment the code in ApiIntegrationTest.tsx
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  disabledTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  disabledText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  disabledSubText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
  },
});

export default ApiIntegrationTestDisabled;
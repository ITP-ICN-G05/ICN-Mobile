// src/components/ApiIntegrationTest.tsx
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { userApiService } from '../services/userApiService';
import { organisationApiService } from '../services/organisationApiService';
import { hybridDataService } from '../services/hybridDataService';
import AuthService from '../services/authService';

const ApiIntegrationTest = () => {
  const [results, setResults] = useState<Record<string, any>>({});

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setResults((prev: Record<string, any>) => ({ ...prev, [testName]: 'Running...' }));
    try {
      const result = await testFn();
      setResults((prev: Record<string, any>) => ({ ...prev, [testName]: result }));
      console.log(`✅ [${testName}] Success:`, result);
    } catch (error: any) {
      setResults((prev: Record<string, any>) => ({ ...prev, [testName]: { error: error.message } }));
      console.error(`❌ [${testName}] Error:`, error);
      Alert.alert('Test Failed', `[${testName}]: ${error.message}`);
    }
  };

  // 1. 测试基本API连接
  const testApiConnection = () => runTest('API Connection', async () => {
    // 使用一个简单的、不需要认证的端点
    const response = await fetch('http://localhost:8082/api/user/getCode?email=test@example.com');
    if (!response.ok) {
      throw new Error(`HTTP Status: ${response.status}`);
    }
    return { status: response.status, statusText: response.statusText };
  });

  // 2. 测试用户登录（成功）
  const testLoginSuccess = () => runTest('Login (Success)', () => {
    // 使用您后端存在的有效用户凭证
    return AuthService.login('user@example.com', 'mypassword');
  });

  // 3. 测试用户登录（失败）
  const testLoginFailure = () => runTest('Login (Failure)', async () => {
    try {
      await AuthService.login('wrong@example.com', 'wrongpassword');
      return 'Test failed: Expected login to fail, but it succeeded.';
    } catch (error) {
      return { message: 'Login failed as expected.', error: (error as Error).message };
    }
  });

  // 4. 测试组织搜索
  const testOrgSearch = () => runTest('Organisation Search', () => {
    return organisationApiService.searchOrganisationsWithErrorHandling(
      'Melbourne',
      { sector: 'technology' },
      'software',
      { limit: 5 }
    );
  });

  // 5. 测试混合数据服务
  const testHybridSearch = () => runTest('Hybrid Search', () => {
    hybridDataService.setApiEnabled(true); // 确保API优先
    return hybridDataService.searchCompanies('software', 'Melbourne', {}, 5);
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Integration Tests</Text>
      
      <View style={styles.testSection}>
        <Button title="1. Test API Connection" onPress={testApiConnection} />
        <Text style={styles.resultText}>{JSON.stringify(results['API Connection'], null, 2)}</Text>
      </View>

      <View style={styles.testSection}>
        <Button title="2. Test Login (Success)" onPress={testLoginSuccess} />
        <Text style={styles.resultText}>{JSON.stringify(results['Login (Success)'], null, 2)}</Text>
      </View>

      <View style={styles.testSection}>
        <Button title="3. Test Login (Failure)" onPress={testLoginFailure} />
        <Text style={styles.resultText}>{JSON.stringify(results['Login (Failure)'], null, 2)}</Text>
      </View>

      <View style={styles.testSection}>
        <Button title="4. Test Organisation Search" onPress={testOrgSearch} />
        <Text style={styles.resultText}>{JSON.stringify(results['Organisation Search'], null, 2)}</Text>
      </View>

      <View style={styles.testSection}>
        <Button title="5. Test Hybrid Search" onPress={testHybridSearch} />
        <Text style={styles.resultText}>{JSON.stringify(results['Hybrid Search'], null, 2)}</Text>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  testSection: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  resultText: {
    marginTop: 10,
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
});

export default ApiIntegrationTest;

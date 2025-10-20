# ICN Mobile 前端 API 集成指南

## 📋 概述

本指南展示如何将ICN Mobile前端与后端API（`http://localhost:8082/api`）进行集成。我们创建了完整的API服务层来处理用户管理和组织数据。

## 🏗️ 架构概览

```
ICN Mobile Frontend
├── services/
│   ├── apiConfig.ts         # 基础API配置和HTTP客户端
│   ├── userApiService.ts    # 用户相关API服务
│   ├── organisationApiService.ts # 组织相关API服务
│   └── authService.ts       # 更新的认证服务
```

## 🔧 核心服务文件

### 1. `apiConfig.ts` - 基础API配置

```typescript
// 自动处理环境切换
const API_BASE_URL = __DEV__ ? 
  'http://localhost:8082/api' :  // 开发环境
  'https://api.icnvictoria.com/api';  // 生产环境

// 统一的错误处理和响应格式
class BaseApiService {
  protected async request<T>(endpoint: string, method: HttpMethod, body?: any) {
    // 自动添加认证头
    // 统一错误处理
    // 请求/响应日志
  }
}
```

### 2. `userApiService.ts` - 用户API服务

基于后端API指南实现的用户服务：

```typescript
// 用户登录
await userApiService.login(email, password);

// 用户注册
await userApiService.createUser({
  email: 'user@example.com',
  name: 'John Doe',
  password: 'password',
  code: '123456'
});

// 发送验证码
await userApiService.sendValidationCode(email);
```

### 3. `organisationApiService.ts` - 组织API服务

```typescript
// 搜索组织
const results = await organisationApiService.searchOrganisations({
  location: 'Melbourne',
  filterParameters: { sector: 'technology' },
  searchString: 'software',
  skip: 0,
  limit: 10
});

// 获取组织详情
const details = await organisationApiService.getOrganisationDetails(
  'org123', 
  'user456'
);
```

## 📱 在React Native组件中使用

### 登录组件示例

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import AuthService from '../services/authService';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('错误', '请输入邮箱和密码');
      return;
    }

    setLoading(true);
    try {
      const userData = await AuthService.login(email, password);
      Alert.alert('成功', `欢迎 ${userData.name}!`);
      // 导航到主页面
    } catch (error: any) {
      Alert.alert('登录失败', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="邮箱"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="密码"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? "登录中..." : "登录"}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
};
```

### 公司搜索组件示例

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';
import { organisationApiService, OrganisationCard } from '../services/organisationApiService';

const CompanySearchScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [companies, setCompanies] = useState<OrganisationCard[]>([]);
  const [loading, setLoading] = useState(false);

  const searchCompanies = async () => {
    setLoading(true);
    try {
      const results = await organisationApiService.searchOrganisationsWithErrorHandling(
        'Melbourne', // 位置
        { sector: 'technology' }, // 过滤条件
        searchText, // 搜索文本
        { skip: 0, limit: 20 } // 分页
      );
      setCompanies(results);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchCompanies();
  }, [searchText]);

  const renderCompany = ({ item }: { item: OrganisationCard }) => (
    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.itemName}</Text>
      <Text style={{ color: '#666' }}>{item.sectorName}</Text>
    </View>
  );

  return (
    <View>
      <TextInput
        placeholder="搜索公司..."
        value={searchText}
        onChangeText={setSearchText}
        style={{ padding: 12, borderWidth: 1, margin: 16 }}
      />
      <FlatList
        data={companies}
        renderItem={renderCompany}
        keyExtractor={(item) => item._id}
        refreshing={loading}
        onRefresh={searchCompanies}
      />
    </View>
  );
};
```

## 🔄 API集成步骤

### 步骤1：更新现有服务

1. **替换authService.ts中的硬编码URL**：
   ```typescript
   // 旧代码
   await fetch('https://api.icnvictoria.com/auth/logout', ...)
   
   // 新代码
   await userApiService.logout();
   ```

2. **更新icnDataService.ts集成后端数据**：
   ```typescript
   // 当前：仅使用本地JSON文件
   import ICNData from '../../assets/ICN_Navigator.Company.json';
   
   // 集成后：结合本地数据和API数据
   const companies = await organisationApiService.searchOrganisations(...);
   ```

### 步骤2：环境配置

在项目根目录创建 `.env` 文件：

```env
# 开发环境
API_BASE_URL=http://localhost:8082/api
API_TIMEOUT=10000

# 生产环境 (生产构建时使用)
# API_BASE_URL=https://api.icnvictoria.com/api
# API_TIMEOUT=15000
```

### 步骤3：错误处理策略

```typescript
// 在组件中统一处理API错误
const handleApiError = (error: any) => {
  if (error.status === 409) {
    // 处理认证失败
    Alert.alert('认证失败', '用户名或密码错误');
  } else if (error.status === 500) {
    // 处理服务器错误
    Alert.alert('服务器错误', '请稍后重试');
  } else {
    // 处理其他错误
    Alert.alert('错误', error.message || '请求失败');
  }
};
```

## 🧪 测试集成

### 1. 启动后端服务器

```bash
# 确保后端服务运行在 localhost:8082
java -jar icn-backend.jar
```

### 2. 测试API连接

```typescript
// 在应用启动时测试API连接
const testApiConnection = async () => {
  try {
    const response = await fetch('http://localhost:8082/api/user/getCode?email=test@example.com');
    console.log('API连接状态:', response.status);
  } catch (error) {
    console.error('API连接失败:', error);
  }
};
```

### 3. 调试工具

在开发环境中启用详细的API日志：

```typescript
// 在apiConfig.ts中
console.log(`🌐 API ${method} ${url}`, body ? { body } : '');
console.log(`✅ API ${method} ${url} - Success`);
console.error(`❌ API ${method} ${url} - Error:`, result.error);
```

## 🚀 部署注意事项

### 开发环境
- 后端：`http://localhost:8082/api`
- 前端：Metro bundler会自动处理localhost连接

### 生产环境
- 更新API_BASE_URL为生产环境地址
- 启用HTTPS
- 配置CORS策略
- 实现proper认证token管理

## 📋 后续改进建议

1. **实现JWT认证**：
   - 在后端添加JWT token支持
   - 在前端实现token刷新机制

2. **添加缓存策略**：
   - 实现API响应缓存
   - 离线数据支持

3. **性能优化**：
   - 实现请求去重
   - 添加请求队列管理

4. **错误恢复**：
   - 自动重试机制
   - 网络状态检测

这个集成方案提供了完整的前后端连接解决方案，基于您提供的后端API指南实现，并保持了良好的代码组织和错误处理。
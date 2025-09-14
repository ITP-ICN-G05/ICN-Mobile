#!/bin/bash

# ICN Navigator Mobile MVP Setup Script
# This script initializes the React Native Expo project according to Sprint 2 specifications

echo "🚀 ICN Navigator Mobile MVP Setup Starting..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile not found. Please run this script from the project root directory."
    exit 1
fi

# Step 1: Create Expo project
print_header "Creating Expo React Native project..."
if [ ! -d "ICNNavigatorMobile" ]; then
    npx create-expo-app ICNNavigatorMobile --template blank-typescript
    cd ICNNavigatorMobile
else
    print_warning "Project directory already exists. Navigating to ICNNavigatorMobile..."
    cd ICNNavigatorMobile
fi

# Step 2: Install core dependencies
print_header "Installing core dependencies..."
npm install --save --legacy-peer-deps \
    @react-navigation/native \
    @react-navigation/bottom-tabs \
    @react-navigation/stack \
    @react-navigation/native-stack \
    react-native-screens \
    react-native-safe-area-context \
    react-native-maps \
    react-native-maps-clustering \
    @reduxjs/toolkit \
    react-redux \
    axios \
    @expo/vector-icons \
    react-native-elements \
    react-native-svg \
    expo-auth-session \
    expo-crypto \
    expo-secure-store \
    expo-sharing \
    expo-file-system \
    expo-location \
    supercluster

# Step 3: Install development dependencies
print_header "Installing development dependencies..."
npm install --save-dev --legacy-peer-deps \
    @types/react \
    @types/react-native \
    @typescript-eslint/eslint-plugin \
    @typescript-eslint/parser \
    eslint \
    prettier \
    jest \
    @testing-library/react-native \
    @testing-library/jest-native

# Step 4: Create project structure
print_header "Creating project directory structure..."
mkdir -p src/{components,screens,navigation,services,store,types,utils,constants}
mkdir -p src/components/{common,forms,maps}
mkdir -p src/screens/{auth,company,search,profile}
mkdir -p assets/{images,icons}

# Step 5: Create configuration files
print_header "Creating configuration files..."

# Create app.json with proper configuration
cat > app.json << EOL
{
  "expo": {
    "name": "ICN Navigator",
    "slug": "icn-navigator-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.icnvictoria.navigator"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.icnvictoria.navigator"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-secure-store",
      "expo-auth-session"
    ],
    "scheme": "icn-navigator"
  }
}
EOL

# Create TypeScript configuration
cat > tsconfig.json << EOL
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/screens/*": ["src/screens/*"],
      "@/services/*": ["src/services/*"],
      "@/store/*": ["src/store/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"],
      "@/constants/*": ["src/constants/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
EOL

# Create ESLint configuration
cat > .eslintrc.js << EOL
module.exports = {
  extends: [
    'expo',
    '@react-native-community',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'react-native/no-inline-styles': 'warn',
  },
  ignorePatterns: ['node_modules/', '.expo/'],
};
EOL

# Create Prettier configuration
cat > .prettierrc << EOL
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOL

# Step 6: Create initial source files
print_header "Creating initial source files..."

# Create constants file
cat > src/constants/index.ts << EOL
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#212121',
  textSecondary: '#757575',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
EOL

# Create types file
cat > src/types/index.ts << EOL
export interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  website?: string;
  email?: string;
  phone?: string;
  employees?: number;
  revenue?: number;
  foundedYear?: number;
  tags?: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  tier: 'basic' | 'premium' | 'enterprise';
  createdAt: string;
}

export interface SearchFilters {
  industry?: string[];
  location?: {
    city?: string;
    state?: string;
    country?: string;
    radius?: number;
  };
  employees?: {
    min?: number;
    max?: number;
  };
  revenue?: {
    min?: number;
    max?: number;
  };
  foundedYear?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface CompanyState {
  companies: Company[];
  filteredCompanies: Company[];
  selectedCompany: Company | null;
  searchQuery: string;
  filters: SearchFilters;
  isLoading: boolean;
  error: string | null;
}
EOL

# Create basic navigation structure
cat > src/navigation/AppNavigator.tsx << EOL
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
EOL

# Create main App.tsx file
cat > App.tsx << EOL
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <StatusBar style="auto" />
      <AppNavigator />
    </Provider>
  );
}
EOL

print_header "Creating environment template..."
cat > .env.example << EOL
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api

# Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id

# Environment
NODE_ENV=development
EOL

# Update package.json scripts
print_header "Updating package.json scripts..."
npx json -I -f package.json -e 'this.scripts.lint="eslint . --ext .js,.jsx,.ts,.tsx"'
npx json -I -f package.json -e 'this.scripts["lint:fix"]="eslint . --ext .js,.jsx,.ts,.tsx --fix"'
npx json -I -f package.json -e 'this.scripts.format="prettier --write ."'
npx json -I -f package.json -e 'this.scripts["format:check"]="prettier --check ."'
npx json -I -f package.json -e 'this.scripts.test="jest"'
npx json -I -f package.json -e 'this.scripts["test:watch"]="jest --watch"'

print_status "✅ ICN Navigator Mobile MVP setup completed successfully!"
print_status ""
print_status "📋 Next steps:"
print_status "1. Copy .env.example to .env and fill in your API keys"
print_status "2. Run 'npm start' to start the Expo development server"
print_status "3. Use Expo Go app on your device or simulators to test"
print_status ""
print_status "🔧 Available commands:"
print_status "  npm start          - Start Expo development server"
print_status "  npm run android    - Start on Android emulator"
print_status "  npm run ios        - Start on iOS simulator"
print_status "  npm run lint       - Run ESLint"
print_status "  npm run format     - Format code with Prettier"
print_status "  npm test           - Run tests"
print_status ""
print_status "📱 Project structure created according to Sprint 2 specifications"
print_status "🎯 Ready for Week 1 development tasks!"

cd ..
print_status "Setup completed! Navigate to ICNNavigatorMobile directory to start development."
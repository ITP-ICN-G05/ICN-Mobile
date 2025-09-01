# Developer Guidelines – Mobile Front-End (React Native)

This document outlines best practices for developing the React Native mobile app for the ICN Navigator project. While the original developer guidelines article focuses on backend applications, many of its principles apply equally well to mobile development.

## Purpose and Audience

These guidelines are intended for developers creating the iOS and Android applications using React Native with Expo. Following them will help you write clean, maintainable and performant mobile code.

## Repository Structure

### Current Structure
Based on the actual file structure, the ICN-Mobile currently has:
```
ICN-Mobile/
├── README.md                        # Documentation
├── .gitignore                       # Git ignore file
├── LICENSE                          # MIT LICENSE
└── icn-mobile/
    ├── .expo/                       # Expo cache files
    ├── .vscode/                     # VSCode configuration
    ├── app/                         # Screens and routes (Expo Router)
    ├── assets/                      # Images, fonts, icons
    ├── components/                  # Reusable UI components
    ├── constants/                   # Config and API helpers
    ├── hooks/                       # Custom React hooks
    ├── scripts/                     # Automation scripts
    ├── node_modules/                # Dependencies
    ├── app.json                     # Expo configuration
    ├── eslint.config.js             # ESLint configuration ✓
    ├── expo-env.d.ts                # Expo TypeScript definitions ✓
    ├── package.json                 # Dependencies and scripts
    ├── package-lock.json            # Dependency lock file
    └── tsconfig.json                # TypeScript configuration ✓
```

### Recommended Structure Additions
To further align with best practices, add the following:

```
ICN-Mobile/
├── .github/
│   └── workflows/                   # ADD: GitHub Actions CI/CD
│       ├── test.yml
│       ├── build-preview.yml
│       └── release.yml
└── icn-mobile/
    ├── .pre-commit-config.yaml      # ADD: Pre-commit hooks
    ├── .prettierrc                  # ADD: Prettier configuration
    ├── eas.json                     # ADD: EAS Build configuration
    ├── app/
    │   ├── (tabs)/                  # ORGANIZE: Tab navigation screens
    │   ├── (auth)/                  # ADD: Authentication flow screens
    │   ├── _layout.tsx              # CHECK: Ensure root layout exists
    │   └── +not-found.tsx           # ADD: 404 error screen
    ├── components/
    │   ├── common/                  # ORGANIZE: Generic components
    │   ├── ui/                      # ORGANIZE: Styled UI elements
    │   └── __tests__/               # ADD: Component tests
    ├── services/                    # ADD: API services layer
    │   ├── api.ts                   # MOVE from constants/api.ts
    │   ├── auth.ts                  # ADD: Authentication service
    │   └── storage.ts               # ADD: Secure storage service
    ├── utils/                       # ADD: Utility functions
    │   ├── validation.ts
    │   └── formatting.ts
    ├── types/                       # ADD: TypeScript type definitions
    │   ├── api.d.ts
    │   └── navigation.d.ts
    ├── __tests__/                   # ADD: Test files
    │   ├── setup.js
    │   └── utils/
    ├── docs/                        # ADD: Documentation
    │   ├── setup.md
    │   ├── architecture.md
    │   └── deployment.md
    ├── .env.example                 # ADD: Environment template
    └── jest.config.js               # ADD: Jest configuration
```

The `ADD` tags indicate new items to create, `ORGANIZE` means restructuring existing code, and `CHECK` means verify if it exists. Note that you already have TypeScript, ESLint, and VSCode configuration in place!

## README.md

The README should provide comprehensive setup instructions:
- Prerequisites (Node.js LTS, npm/yarn, Expo Go app)
- Installation steps (`npm install`)
- Running on device (`npm start` + scan QR with Expo Go)
- API configuration (environment variables)
- Building for production (EAS Build)
- Testing instructions
- Contributing guidelines

## Documentation

Store documentation in `docs/` with subfolders for diagrams and images. Cover:

- **Getting Started**: prerequisites, environment setup, installing dependencies, running the development server
- **Navigation Architecture**: Expo Router structure, navigation flows, deep linking
- **State Management**: Context API or chosen state management solution
- **API Integration**: endpoints, authentication, error handling
- **Platform Differences**: iOS vs Android specific implementations
- **Performance Guidelines**: optimisation techniques, profiling
- **Testing Strategy**: unit tests with Jest, E2E tests with Detox

## Build & Scripts

Define npm scripts in `package.json` to standardise development tasks:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "validate": "npm run lint && npm run format && npm test",
    "eas:build:preview": "eas build --profile preview",
    "eas:build:production": "eas build --profile production"
  }
}
```

| Script | Purpose |
|--------|---------|
| `npm start` | Start Expo development server |
| `npm run android` | Open in Android emulator |
| `npm run ios` | Open in iOS simulator |
| `npm test` | Run unit tests with Jest |
| `npm run lint` | Run ESLint checks |
| `npm run format` | Format code with Prettier |
| `npm run validate` | Run all validation checks |

## .gitignore

Generate a `.gitignore` using gitignore.io for React Native, Node and Expo:

```gitignore
# Dependencies
node_modules/

# Expo
.expo/
dist/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/

# Testing
coverage/

# Production
build/

# Debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# local env files
.env*.local

# IDE
.idea/
.vscode/
*.swp
*.swo
```

## Pre-Commit Hooks

Configure `.pre-commit-config.yaml` for mobile development:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: end-of-file-fixer
      - id: trailing-whitespace
      - id: check-added-large-files
      - id: check-merge-conflict
      - id: detect-private-key
      
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.36.0
    hooks:
      - id: eslint
        files: \.(js|jsx|ts|tsx)$
        args: ['--fix']
        
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v2.7.1
    hooks:
      - id: prettier
        files: \.(js|jsx|ts|tsx|json)$
        
  - repo: https://github.com/codespell-project/codespell
    rev: v2.2.4
    hooks:
      - id: codespell
```

Consider using Husky with lint-staged for a better developer experience.

## Coding Standards

### Language
- Use TypeScript for type safety
- Configure `tsconfig.json` properly:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```
- Prefer functional components and React hooks
- Use Expo Router for file-based routing

### Style & Formatting
- Configure ESLint with React Native and TypeScript presets
- Use Prettier with `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5"
}
```
- Use StyleSheet for styling, avoid inline styles
- Implement a consistent theming system

### Testing
- Write unit tests with Jest and React Native Testing Library
- Mock native modules appropriately
- Test on both iOS and Android platforms
- Maintain test coverage above 70%

## API Configuration

Configure API endpoints for different environments:

### constants/api.ts
```typescript
import axios from 'axios';
import { Platform } from 'react-native';

const getBaseURL = () => {
  if (__DEV__) {
    // Development
    return Platform.OS === 'android' 
      ? 'http://10.0.2.2:8080'  // Android emulator
      : 'http://localhost:8080'; // iOS simulator
  }
  // Production
  return process.env.EXPO_PUBLIC_API_URL || 'https://api.icn-navigator.com';
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

// Add interceptors for auth and error handling
API.interceptors.request.use(
  config => {
    // Add auth token if available
    return config;
  },
  error => Promise.reject(error)
);

API.interceptors.response.use(
  response => response,
  error => {
    // Handle errors globally
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default API;
```

## Mobile-Specific Practices

### Navigation
- Use Expo Router for file-based navigation
- Implement deep linking support
- Handle back button properly on Android
- Manage navigation state for authentication flows

### Performance
- Use React.memo and useMemo for expensive computations
- Implement FlatList with proper optimisations:
```typescript
<FlatList
  data={data}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  getItemLayout={getItemLayout} // If items have fixed height
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```
- Lazy load images and heavy components
- Monitor performance with React DevTools

### Platform Differences
```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});
```

### Security and Permissions
- Request permissions at runtime:
```typescript
import * as Camera from 'expo-camera';

const requestCameraPermission = async () => {
  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    alert('Camera permission is required');
    return false;
  }
  return true;
};
```
- Store sensitive data securely using expo-secure-store
- Validate all user inputs
- Implement certificate pinning for production

## Continuous Integration (CI)

Automate builds and tests with GitHub Actions:

### .github/workflows/build.yml
```yaml
name: Build and Test
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run validate
      - run: npm test -- --coverage
      
  build-preview:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --profile preview --non-interactive
```

### .github/workflows/release.yml
```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  build-and-submit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --profile production --non-interactive
      - run: eas submit --profile production --non-interactive
```

## Development Strategy

Adopt a disciplined development process using feature branches and PRs:

1. **Define the feature clearly**: Understand acceptance criteria and user flows
2. **Create a feature branch**: Use descriptive names like `feature/login-screen`
3. **Write descriptive commits**: Follow conventional commits format
4. **Rebase frequently**: Keep your branch up to date with main
5. **Write tests**: Cover new screens, components and hooks
6. **Test on devices**: Test on both iOS and Android physical devices
7. **Open a pull request**: Assign reviewers, respond to feedback
8. **Merge after approval**: Ensure CI passes and PR is approved
9. **Update documentation**: Keep docs current with changes

## Expo Configuration

### app.json
```json
{
  "expo": {
    "name": "ICN Mobile",
    "slug": "icn-mobile",
    "version": "2025.01.1",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.icn.mobile"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.icn.mobile"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### eas.json
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://staging-api.icn-navigator.com"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.icn-navigator.com"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Deployment & Versioning

### Versioning
- Use Calendar Versioning: `YYYY.MM.INC` (e.g., `2025.01.1`)
- Update version in app.json for each release
- Tag releases in Git

### Build Process
- Use EAS Build for creating binaries
- Configure separate build profiles for development, preview, and production
- Automate builds through CI/CD

### Distribution
- Internal testing via Expo Go or custom dev clients
- Beta testing through TestFlight (iOS) and Google Play Console (Android)
- Production release through app stores

## Summary

These developer guidelines bring the high-level principles from the Developer Guidelines article into the context of a React Native mobile application using Expo. A clean repository structure, automated checks (pre-commit, CI), comprehensive documentation, disciplined branching and code review, and clear deployment/versioning strategies will ensure your mobile codebase remains maintainable and scalable. By adhering to these practices you will deliver a robust, performant and polished mobile experience for users of the ICN Navigator.
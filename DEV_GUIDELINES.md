# Developer Guidelines – Mobile Front-End (React Native)

This document outlines best practices for developing the React Native mobile app for the ICN Navigator project using a Docker-based development environment with Make commands.

## Purpose and Audience

These guidelines are intended for developers creating the iOS and Android applications using React Native with Expo in a containerized development environment. Following them will help you write clean, maintainable and performant mobile code.

## Repository Structure

### Current Structure
Based on the actual file structure, the ICN-Mobile currently has:
```
ICN-Mobile/
├── README.md                        # Documentation
├── LICENSE                          # MIT LICENSE
├── DEV_GUIDELINES.md                # Developer guidelines
├── Dockerfile                       # Docker container configuration
├── docker-compose.yml               # Container orchestration
├── Makefile                         # Development commands
├── setup.sh                         # Automated setup script
└── ICNNavigatorMobile/              # React Native project
    ├── src/                         # Source code (organized structure)
    │   ├── components/              # Reusable UI components
    │   ├── screens/                 # Screen components  
    │   ├── navigation/              # Navigation configuration
    │   ├── services/                # API and external services
    │   ├── store/                   # Redux store configuration
    │   ├── types/                   # TypeScript definitions
    │   ├── utils/                   # Utility functions
    │   └── constants/               # App constants
    ├── assets/                      # Images, fonts, icons
    │   ├── icons/                   # App icons
    │   ├── images/                  # Images and graphics
    │   ├── adaptive-icon.png        # Android adaptive icon
    │   ├── favicon.png              # Web favicon
    │   ├── icon.png                 # App icon
    │   └── splash-icon.png          # Splash screen icon
    ├── app.json                     # Expo configuration
    ├── App.tsx                      # Main app component
    ├── package.json                 # Dependencies and scripts
    ├── package-lock.json            # Dependency lock file
    ├── tsconfig.json                # TypeScript configuration
    ├── .env.example                 # Environment variables template
    ├── .env                         # Environment variables (local)
    └── index.ts                     # Entry point
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
├── docs/                            # ADD: Project documentation
│   ├── setup.md
│   ├── architecture.md
│   └── deployment.md
└── ICNNavigatorMobile/
    ├── .prettierrc                  # ADD: Prettier configuration
    ├── eas.json                     # ADD: EAS Build configuration
    ├── jest.config.js               # ADD: Jest configuration
    ├── src/
    │   ├── components/
    │   │   ├── common/              # ORGANIZE: Generic components
    │   │   ├── forms/               # ORGANIZE: Form components
    │   │   ├── maps/                # ORGANIZE: Map components
    │   │   └── __tests__/           # ADD: Component tests
    │   ├── screens/
    │   │   ├── auth/                # ORGANIZE: Authentication screens
    │   │   ├── company/             # ORGANIZE: Company screens
    │   │   ├── search/              # ORGANIZE: Search screens
    │   │   └── profile/             # ORGANIZE: Profile screens
    │   └── __tests__/               # ADD: Test files
    └── docs/                        # ADD: Technical documentation
```

## README.md

The README should provide comprehensive setup instructions for the Docker-based workflow:
- Prerequisites (Docker, Docker Compose, Git)
- Installation steps (`make setup`)
- Running on device (`make start` + scan QR with Expo Go)
- Environment configuration (inside container)
- Building for production (EAS Build)
- Testing instructions (`make test`)
- Make command reference

## Documentation

Store documentation in `docs/` with subfolders for diagrams and images. Cover:

- **Getting Started**: Docker setup, Make commands, environment configuration
- **Development Workflow**: Container-based development, Make command usage
- **Navigation Architecture**: React Navigation structure, navigation flows
- **State Management**: Redux Toolkit implementation
- **API Integration**: Backend connectivity, authentication, error handling
- **Platform Differences**: iOS vs Android specific implementations
- **Performance Guidelines**: optimization techniques, profiling
- **Testing Strategy**: unit tests with Jest, component testing
- **Deployment**: EAS Build, app store deployment

## Build & Scripts

### Make Commands
The primary development interface uses Make commands defined in the Makefile:

```makefile
# Core Development Commands
make setup       # Initial project setup with Docker
make dev         # Start development environment
make start       # Start Expo development server
make android     # Run on Android emulator
make ios         # Run on iOS simulator

# Utility Commands
make shell       # Open container shell
make logs        # View container logs
make status      # Check environment status
make install     # Install dependencies

# Code Quality Commands
make lint        # Run ESLint
make format      # Format code with Prettier
make test        # Run unit tests

# Quick Commands
make quick-start # Build + install + start (one command)
make reset       # Emergency reset of environment
make clean       # Clean up Docker resources
```

### Package.json Scripts
Inside the container (`ICNNavigatorMobile/package.json`):

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "validate": "npm run lint && npm run format && npm test"
  }
}
```

| Make Command | Purpose |
|-------------|---------|
| `make setup` | Initial project setup with Docker |
| `make start` | Start Expo development server |
| `make android` | Open in Android emulator |
| `make ios` | Open in iOS simulator |
| `make test` | Run unit tests with Jest |
| `make lint` | Run ESLint checks |
| `make format` | Format code with Prettier |

## .gitignore

Generate a `.gitignore` for React Native, Node, Expo, and Docker:

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

# Environment files - NEVER COMMIT THESE
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

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

# IDE
.idea/
.vscode/
*.swp
*.swo

# Docker
.dockerignore
```

## Development Workflow

### Docker-Based Development Process
1. **Setup Environment**: `make setup` (one-time setup)
2. **Start Development**: `make dev` or `make start`
3. **Code Changes**: Edit files with hot reload
4. **Test Changes**: `make test`, `make lint`
5. **Debug Issues**: `make logs`, `make shell`
6. **Platform Testing**: `make android`, `make ios`

### Container Management
- **Enter Container**: `make shell` for debugging and manual commands
- **View Logs**: `make logs` for troubleshooting
- **Reset Environment**: `make reset` for complete cleanup
- **Check Status**: `make status` for container health

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
    "noImplicitReturns": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/screens/*": ["src/screens/*"]
    }
  }
}
```
- Prefer functional components and React hooks
- Use React Navigation for navigation

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
- Use `make test` for running tests

## Environment Configuration

### Docker Environment Setup
Environment variables are managed inside the Docker container:

```bash
# Enter container
make shell

# Navigate to React Native project
cd ICNNavigatorMobile

# Set up environment variables
cp .env.example .env
# Edit .env with actual values
```

### Environment Variables Template
```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api

# Google Services (Required)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id

# LinkedIn OAuth
EXPO_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id

# Development Configuration
NODE_ENV=development
EXPO_NO_TELEMETRY=1
```

### API Configuration
Configure API endpoints for containerized development:

```typescript
// src/services/api.ts
import axios from 'axios';
import { Platform } from 'react-native';

const getBaseURL = () => {
  if (__DEV__) {
    // Development - Docker container networking
    return Platform.OS === 'android' 
      ? 'http://10.0.2.2:8080/api'  // Android emulator
      : 'http://localhost:8080/api'; // iOS simulator
  }
  // Production
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.icn-navigator.com';
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
- Use React Navigation for navigation
- Implement deep linking support
- Handle back button properly on Android
- Manage navigation state for authentication flows

### Performance
- Use React.memo and useMemo for expensive computations
- Implement FlatList with proper optimizations:
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
- Request permissions at runtime
- Store sensitive data securely using expo-secure-store
- Validate all user inputs
- Implement certificate pinning for production

## Continuous Integration (CI)

Automate builds and tests with GitHub Actions for Docker-based workflow:

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
      - name: Set up Docker
        uses: docker/setup-buildx-action@v2
      - name: Build and test
        run: |
          make build
          make up
          make install
          make test
          make lint
      - name: Cleanup
        run: make clean
        if: always()
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
      - name: Set up Docker
        uses: docker/setup-buildx-action@v2
      - name: Build and deploy
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
        run: |
          make build
          make up
          make install
          make shell -c "cd ICNNavigatorMobile && eas build --profile production --non-interactive"
```

## Development Strategy

Adopt a disciplined development process using feature branches and Make commands:

1. **Define the feature clearly**: Understand acceptance criteria and user flows
2. **Create a feature branch**: Use descriptive names like `feature/login-screen`
3. **Start development environment**: `make dev`
4. **Write descriptive commits**: Follow conventional commits format
5. **Test continuously**: `make test`, `make lint`, `make android`, `make ios`
6. **Write tests**: Cover new screens, components and hooks
7. **Open a pull request**: Assign reviewers, respond to feedback
8. **Merge after approval**: Ensure CI passes and PR is approved
9. **Update documentation**: Keep docs current with changes

## Expo Configuration

### app.json
```json
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
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.icnvictoria.navigator"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.icnvictoria.navigator"
    },
    "plugins": [
      "expo-secure-store"
    ],
    "scheme": "icn-navigator"
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

### Docker-Based Build Process
- Use `make build` for Docker image creation
- Use EAS Build inside container for app binaries
- Configure separate build profiles for development, preview, and production
- Automate builds through CI/CD with Docker

### Versioning
- Use Semantic Versioning: `MAJOR.MINOR.PATCH` (e.g., `1.0.0`)
- Update version in app.json for each release
- Tag releases in Git
- Coordinate with Docker image versioning

### Distribution
- Internal testing via Expo Go or custom dev clients
- Beta testing through TestFlight (iOS) and Google Play Console (Android)
- Production release through app stores

## Troubleshooting

### Container Issues
- **Container won't start**: `make clean` then `make setup`
- **Dependencies issues**: `make install`
- **Environment problems**: `make shell` then check environment variables
- **Performance issues**: `make status` to check container health

### Development Issues
- **Metro bundler issues**: `make logs` to check container logs
- **Device connection**: Ensure same Wi-Fi network, check `make status`
- **Build failures**: `make clean` and `make reset` for complete refresh

### Make Command Reference
```bash
make help        # Show all available commands
make status      # Check container and environment status
make logs        # View detailed container logs
make shell       # Enter container for debugging
make reset       # Complete environment reset
```

## Summary

These developer guidelines establish a Docker-based development workflow using Make commands for the React Native ICN Navigator mobile application. The containerized approach ensures consistent development environments across team members while the Make command interface simplifies complex Docker operations. A clean repository structure, automated checks, comprehensive documentation, and clear deployment strategies will ensure your mobile codebase remains maintainable and scalable. By adhering to these practices and utilizing the Docker-based workflow, you will deliver a robust, performant and polished mobile experience for users of the ICN Navigator.
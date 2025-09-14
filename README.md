# ICN Navigator Mobile

This is the **mobile frontend** for the ICN Navigator project, built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/).  
It connects to the Spring Boot backend via REST APIs.

## ✨ Latest Improvements

**Smart Development Environment (v2.0)**
- 🔧 **Idempotent Setup**: `make setup` can be run multiple times safely
- 📦 **Smart Dependency Management**: Automatic conflict resolution with `--legacy-peer-deps`
- 🌐 **Multi-Network Support**: Tunnel, LAN, and localhost connection modes
- 🔍 **Comprehensive Diagnostics**: New `make diagnose` command for troubleshooting
- 💻 **Cross-Platform**: Windows line ending fixes and enhanced compatibility
- ⚡ **Performance**: Configuration preservation and skip-if-exists logic

---

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Git
- Google Maps API Key (required for map functionality)

### Installation
```bash
# Clone repository
git clone git@github.com:ITP-ICN-G05/ICN-Mobile.git
cd ICN-Mobile

# Initial setup (smart setup - idempotent)
make setup

# Alternative setup commands
make rebuild     # Force rebuild Docker images
make reinstall   # Force reinstall dependencies
make fix-expo    # Fix Expo dependencies and versions
```

### Running on Device
```bash
# Start development environment
make dev

# Multiple Expo server options
make start           # Tunnel mode (recommended for most networks)
make start-lan       # LAN mode (same Wi-Fi network)
make start-localhost # Localhost mode (local testing only)
```
* Scan the QR code with **Expo Go** app on your phone
* **Tunnel mode**: Works with any network (uses ngrok)
* **LAN mode**: Requires same Wi-Fi network
* **Localhost mode**: For local testing only
* The app will load instantly with hot reload enabled

### Platform-Specific Commands
```bash
make android    # Run on Android emulator
make ios        # Run on iOS simulator
```

## Environment Configuration

### Setup Environment Variables
```bash
# Enter container shell
make shell

# Navigate to React Native project and set up environment
cd ICNNavigatorMobile
cp .env.example .env
# Edit .env with your actual API keys
```

### Required Environment Variables
```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api

# Google Services (Required)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id

# LinkedIn OAuth
EXPO_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id
```

### Backend Integration
* API helper is located in `src/services/api.ts`
* Default base URL configurations:
  * **Android emulator**: `http://10.0.2.2:8080/api`
  * **iOS simulator/physical device**: `http://localhost:8080/api`
* Backend runs in Docker container, accessible from mobile development container

## Project Structure
```
ICN-Mobile/
├── README.md                # Documentation
├── LICENSE                  # MIT LICENSE
├── Dockerfile               # Docker container configuration
├── docker-compose.yml       # Container orchestration
├── Makefile                 # Development commands
├── setup.sh                 # Automated setup script
├── DEV_GUIDELINES.md        # Developer guidelines
└── ICNNavigatorMobile/      # React Native project
    ├── src/                 # Source code
    │   ├── components/      # Reusable UI components
    │   ├── screens/         # Screen components
    │   ├── navigation/      # Navigation configuration
    │   ├── services/        # API and external services
    │   ├── store/           # Redux store configuration
    │   ├── types/           # TypeScript definitions
    │   ├── utils/           # Utility functions
    │   └── constants/       # App constants
    ├── assets/              # Images, fonts, icons
    │   ├── icons/           # App icons
    │   └── images/          # Images and graphics
    ├── app.json             # Expo configuration
    ├── App.tsx              # Main app component
    ├── package.json         # Dependencies and scripts
    ├── package-lock.json    # Dependency lock file
    ├── tsconfig.json        # TypeScript configuration
    ├── .env.example         # Environment variables template
    └── index.ts             # Entry point
```

## Development Commands

### Setup Commands
```bash
make setup       # Smart initial setup (skips if already built)
make rebuild     # Force rebuild Docker images
make install     # Smart dependency install (skips if exists) 
make reinstall   # Force reinstall dependencies
make fix-expo    # Fix Expo dependencies and versions
make clean-install # Clean install with legacy peer deps
```

### Core Development
```bash
make dev         # Start development environment
make start       # Start Expo server (tunnel mode)
make start-lan   # Start Expo server (LAN mode)
make start-localhost # Start Expo server (localhost mode)
make android     # Run on Android emulator
make ios         # Run on iOS simulator
```

### Utility Commands
```bash
make shell       # Open container shell
make logs        # View container logs
make status      # Check environment status
make diagnose    # Run comprehensive diagnostics
```

### Code Quality
```bash
make lint        # Run ESLint
make format      # Format code with Prettier
make test        # Run unit tests
```

### Maintenance Commands
```bash
make clean       # Clean up Docker resources
make clean-all   # Deep clean Docker resources
make reset       # Emergency reset of environment
make quick-start # Build + install + start (one command)
```

## Testing
* **Unit Testing**: Jest + React Native Testing Library
* **Component Testing**: UI components and interactions  
* **Integration Testing**: API connectivity and data flow
* **Platform Testing**: iOS and Android compatibility

```bash
make test        # Run all tests
make shell       # Enter container for advanced testing
```

## Contributing
1. Create a feature branch: `git checkout -b feature/xyz`
2. Start development environment: `make dev`
3. Write tests for new functionality
4. Ensure code passes linting: `make lint`
5. Test on both platforms: `make android` and `make ios`
6. Commit changes: `git commit -m "feat: add xyz"`
7. Push branch: `git push origin feature/xyz`
8. Open a Pull Request with clear description

### Code Standards
* Use TypeScript for type safety
* Follow ESLint and Prettier configurations
* Write unit tests for components and utilities
* Use functional components with React hooks
* Implement responsive designs for multiple screen sizes

## Build & Deployment

### Development Environment
```bash
make build       # Build Docker images
make up          # Start containers in background
make down        # Stop containers
```

### Production
Built using EAS Build for production deployments to app stores.

## Architecture

### Technology Stack
* **Framework**: React Native with Expo SDK
* **Navigation**: React Navigation (Bottom Tabs + Stack)
* **State Management**: Redux Toolkit
* **Maps**: react-native-maps with Google Maps Platform
* **Authentication**: Expo AuthSession for OAuth
* **API**: Axios for HTTP requests
* **Testing**: Jest + React Native Testing Library

### Key Features
* Cross-platform iOS and Android support
* Google Maps integration with marker clustering
* OAuth authentication (Google/LinkedIn)
* Company search and filtering
* Responsive design for phones and tablets
* Docker containerized development environment

## Troubleshooting

### Smart Setup Features
The development environment now includes intelligent setup detection:
- **Idempotent setup**: `make setup` can be run multiple times safely
- **Smart detection**: Skips Docker builds and dependency installs if already completed
- **Configuration preservation**: Existing config files are not overwritten
- **Cross-platform support**: Automatic line ending conversion for Windows

### Common Issues & Solutions

#### Environment Setup Issues
```bash
make diagnose    # Run comprehensive diagnostics
make status      # Check container and system status
make clean-install # Force clean dependency installation
make fix-expo    # Fix Expo version conflicts
```

#### Dependency Conflicts
```bash
make reinstall   # Force reinstall with --legacy-peer-deps
make fix-expo    # Fix Expo SDK version mismatches
make clean-install # Complete clean install
```

#### Connection Problems
```bash
make start           # Try tunnel mode (recommended)
make start-lan       # Try LAN mode if tunnel fails
make start-localhost # Try localhost for local testing
```

#### Container Issues
```bash
make logs        # View detailed container logs
make shell       # Debug inside container
make reset       # Complete environment reset
make rebuild     # Force rebuild Docker images
```

### Development Environment Diagnosis
```bash
# Check overall system status
make status

# Run comprehensive diagnostics
make diagnose

# View container logs
make logs

# Enter container for manual debugging
make shell
```

### Network Troubleshooting
- **Tunnel mode**: Works with any network configuration (uses ngrok)
- **LAN mode**: Requires same Wi-Fi network between device and computer
- **Localhost mode**: For local testing and debugging only
- **Firewall**: Ensure ports 8081, 19000-19006 are not blocked

### Performance Optimization
- App targets 60 FPS navigation performance
- Map renders efficiently with 1000+ company markers
- Search results display under 2 seconds
- Hot reload provides instant development feedback

## Documentation
* **Getting Started**: Docker setup and installation
* **API Integration**: Backend connectivity and authentication  
* **Component Library**: Reusable UI components
* **Navigation**: Screen flows and deep linking
* **Testing Guide**: Unit and integration testing practices

## Tools
* Docker containerized development environment
* Expo Router for file-based navigation
* React Native Elements for UI components
* Redux DevTools for state debugging
* Make commands for streamlined workflow
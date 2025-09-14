# ICN Navigator Mobile
This is the **mobile frontend** for the ICN Navigator project, built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/).  
It connects to the Spring Boot backend via REST APIs.

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

# Initial setup (automated)
make setup
```

### Running on Device
```bash
# Start development environment
make dev

# Or start Expo development server directly
make start
```
* Scan the QR code with **Expo Go** app on your phone
* Ensure phone and computer are on the same Wi-Fi network
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

### Core Development
```bash
make setup       # Initial project setup
make dev         # Start development environment
make start       # Start Expo development server
make android     # Run on Android emulator
make ios         # Run on iOS simulator
```

### Utility Commands
```bash
make shell       # Open container shell
make logs        # View container logs
make status      # Check environment status
make install     # Install dependencies
```

### Code Quality
```bash
make lint        # Run ESLint
make format      # Format code with Prettier
make test        # Run unit tests
```

### Quick Commands
```bash
make quick-start # Build + install + start (one command)
make reset       # Emergency reset of environment
make clean       # Clean up Docker resources
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

### Common Issues
* **Container not starting**: Run `make clean` then `make setup`
* **Dependencies not installing**: Run `make install`
* **Device not connecting**: Ensure same Wi-Fi network, try `make logs`
* **Maps not displaying**: Verify Google Maps API key in container environment

### Development Environment Issues
```bash
make status      # Check container status
make logs        # View detailed logs
make shell       # Debug inside container
make reset       # Complete environment reset
```

### Performance
* App targets 60 FPS navigation
* Map renders efficiently with 1000+ markers
* Search results display under 2 seconds
* Containerized environment ensures consistent performance

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
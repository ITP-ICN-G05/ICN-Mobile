# ICN Navigator Mobile

A cross-platform mobile application for exploring the Industrial Capability Network (ICN) Victoria's database of companies and their capabilities. Built with Expo and React Native, this app provides iOS and Android users with powerful tools to search, filter, and explore Australian and New Zealand companies in the ICN network.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Environment Configuration](#environment-configuration)
- [Architecture](#architecture)
- [User Tiers](#user-tiers)
- [Data Management](#data-management)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What is ICN Navigator Mobile?

ICN Navigator Mobile is a comprehensive mobile application that provides access to Victoria's Industrial Capability Network database. The app helps users discover and connect with manufacturing and service companies across Australia and New Zealand.

**Data Source:** The app works with ICN's company database stored locally (`ICN_Navigator.Company.json`), containing detailed information about companies, their capabilities, sectors, and locations across Victoria, NSW, Queensland, South Australia, Western Australia, Northern Territory, Tasmania, ACT, and New Zealand.

### Key Capabilities

- **Interactive Map View**: Google Maps integration showing company locations with smart clustering and geocoding
- **Company Discovery**: Browse 1000+ companies with detailed capability information
- **Advanced Filtering**: Filter by sector, location, capabilities, and company attributes
- **Subscription Tiers**: Three-tier system (Free, Plus, Premium) with progressive feature unlocking
- **Data Export**: Export company information based on subscription level
- **Offline Support**: Intelligent geocoding cache for improved performance
- **Smart Search**: Real-time search across company names, capabilities, and sectors

### Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React Native** | 0.81.4 | Cross-platform mobile framework |
| **Expo SDK** | ~54.0 | Development platform and build system |
| **TypeScript** | ~5.9.2 | Type-safe development |
| **React Navigation** | 7.x | Navigation system (Stack + Bottom Tabs) |
| **React Native Maps** | 1.20.1 | Google Maps integration with clustering |
| **Axios** | ^1.12.1 | HTTP client (future API connectivity) |
| **AsyncStorage** | 2.2.0 | Local data persistence |
| **Docker** | Latest | Containerized development environment |

---

## Features

### 🗺️ Interactive Map Screen
- **Google Maps Integration**: Full-featured map with marker clustering for efficient display of 1000+ companies
- **Smart Zoom**: Automatic zoom adjustment based on filtered results with manual zoom lock
- **Company Cards**: Detailed company information cards appear on marker selection
- **Real-time Search**: Search bar with dropdown suggestions for instant company discovery
- **Advanced Filters**: Multi-criteria filtering (sectors, capabilities, states, cities)
- **ICN Branding**: Custom watermark with subscription tier display

### 📱 Companies List Screen
- **List & Grid Views**: Toggle between list and grid layouts
- **Sorting Options**: Sort by name, verification status, or recency
- **Bookmark System**: Save favorite companies (tier-based limits)
- **Statistics Display**: Real-time stats showing total companies, sectors, and capabilities
- **Pull-to-Refresh**: Manual data refresh capability
- **Tier Badges**: Visual indicators for Premium features

### 🏢 Company Detail Screen
- **Complete Company Information**: 
  - Business details (name, address, state, city, postcode)
  - ABN (Plus/Premium only)
  - Validation status and dates
  - Full capability listings with sector information
- **Interactive Actions**:
  - Get directions (opens native maps app)
  - Share company information
  - Bookmark/Save (tier-based)
  - Export to PDF/Excel (tier-based)
  - Contact via ICN Portal
- **Expandable Sections**: 
  - Items/Capabilities (with pagination)
  - Company Projects (Premium feature)
  - Recent News (Premium feature)
  - Contact Information
- **Rich Media**: Company logos and images where available

### 👤 Profile & Settings Screen
- **User Profile Management**:
  - Profile photo upload via image picker
  - Personal information editing
  - Password change functionality
  - Account statistics display
- **Subscription Management**:
  - Current tier display with feature comparison
  - Upgrade/Downgrade options
  - Subscription status and renewal dates
  - Payment history (mock integration ready)
- **App Settings**:
  - Notification preferences
  - Privacy settings
  - Data sync controls
  - Theme preferences (Light mode)
- **Data Management**:
  - Export user data
  - Clear cache options
  - App version and build information
- **Support & Help**:
  - Help center access
  - Contact support
  - Terms of service
  - Privacy policy
  - Rate app functionality

### 🔐 Authentication System
- **Welcome Screen**: Onboarding flow with app introduction
- **Login/Sign Up**: Unified authentication interface
- **Password Reset**: Email-based password recovery
- **OAuth Integration**: Ready for Google and LinkedIn OAuth (configured)
- **Session Management**: Secure token storage with AsyncStorage

### 💳 Subscription & Payment
- **Three-Tier System**: Free, Plus ($4.99/month), Premium ($9.99/month)
- **Payment Screen**: Integrated payment flow (mock processor ready for Stripe)
- **Feature Gating**: Automatic feature access based on subscription tier
- **Upgrade Prompts**: Contextual prompts for premium features

---

## Prerequisites

Before starting, ensure you have:

### Required
- **Docker Desktop** (v20.10 or higher)
- **Docker Compose** (v2.0 or higher)
- **Git**
- **Google Maps API Key** (Required for map functionality)
- **Expo Go App** on your mobile device ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Optional
- **Android Studio** (for Android emulator testing)
- **Xcode** (macOS only, for iOS simulator testing)
- **Node.js** v20+ (if running outside Docker)

---

## Quick Start

### 1. Clone the Repository
```bash
git clone git@github.com:ITP-ICN-G05/ICN-Mobile.git
cd ICN-Mobile
```

### 2. Initial Setup
```bash
# Smart setup - idempotent, safe to run multiple times
make setup
```

This command will:
- Build the Docker development image (Node.js 20)
- Start containers with appropriate port mappings
- Install all npm dependencies with legacy peer deps handling
- Create necessary project structure

### 3. Configure Environment Variables

**Important:** The app requires a Google Maps API key to function properly.

```bash
# Enter the Docker container
make shell

# Navigate to React Native project
cd ICNNavigatorMobile

# Copy environment template
cp .env.example .env

# Edit with your actual API key
nano .env
```

**Minimum required configuration:**
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key
```

### 4. Start Development Server
```bash
# Exit container (Ctrl+D or type 'exit')
# Start Expo development server
make start
```

### 5. Open on Your Device
1. Open **Expo Go** app on your phone
2. Scan the QR code displayed in terminal
3. Wait for the app bundle to load (first load: 1-2 minutes)
4. App will open with hot reload enabled

**Connection modes:**
```bash
make start           # Tunnel mode (works on any network - recommended)
make start-lan       # LAN mode (requires same Wi-Fi network)
make start-localhost # Localhost mode (emulator/simulator only)
```

---

## Project Structure

```
ICN-Mobile/
├── README.md                          # This file
├── LICENSE                            # MIT License
├── DEV_GUIDELINES.md                  # Detailed development guidelines
├── Dockerfile                         # Node.js 20 container configuration
├── docker-compose.yml                 # Container orchestration
├── Makefile                           # Development command interface
├── setup.sh                           # Automated project setup script
│
└── ICNNavigatorMobile/                # React Native Expo application
    │
    ├── App.tsx                        # Application root with context providers
    ├── index.ts                       # Expo entry point
    ├── app.json                       # Expo configuration (SDK 54)
    ├── package.json                   # Dependencies and scripts
    ├── tsconfig.json                  # TypeScript configuration
    │
    ├── src/
    │   │
    │   ├── components/                # Reusable UI components
    │   │   ├── common/               # Generic components
    │   │   │   ├── AuthContainer.tsx            # Authentication wrapper
    │   │   │   ├── CompanyCard.tsx              # Company list item card
    │   │   │   ├── EnhancedFilterModal.tsx      # Advanced filtering interface
    │   │   │   ├── FilterDropdown.tsx           # Filter dropdown component
    │   │   │   ├── FilterModal.tsx              # Basic filter modal
    │   │   │   ├── PaymentSuccessModal.tsx      # Payment confirmation
    │   │   │   ├── ResetPasswordForm.tsx        # Password reset form
    │   │   │   ├── SearchBar.tsx                # Standard search bar
    │   │   │   ├── SearchBarWithDropdown.tsx    # Search with suggestions
    │   │   │   ├── SignInForm.tsx               # Login form
    │   │   │   ├── SignUpForm.tsx               # Registration form
    │   │   │   └── SubscriptionCard.tsx         # Subscription tier card
    │   │   │
    │   │   └── forms/                # Form-specific components
    │   │
    │   ├── screens/                   # Screen components
    │   │   ├── main/                 # Main authenticated screens
    │   │   │   ├── WelcomeScreen.tsx            # Onboarding/welcome
    │   │   │   ├── LoginSignUpResetScreen.tsx   # Unified auth screen
    │   │   │   ├── MapScreen.tsx                # Interactive map (614 lines)
    │   │   │   ├── CompaniesScreen.tsx          # Company list (1070 lines)
    │   │   │   ├── CompanyDetailScreen.tsx      # Company details (2164 lines)
    │   │   │   ├── ProfileScreen.tsx            # User profile (1226 lines)
    │   │   │   ├── EditProfileScreen.tsx        # Profile editing
    │   │   │   └── ChangePasswordScreen.tsx     # Password change
    │   │   │
    │   │   └── subscription/         # Subscription management
    │   │       ├── ManageSubscriptionScreen.tsx # Subscription settings
    │   │       └── PaymentScreen.tsx            # Payment processing (987 lines)
    │   │
    │   ├── navigation/                # Navigation configuration
    │   │   ├── AppNavigator.tsx      # Root navigator with auth switching
    │   │   ├── AuthNavigator.tsx     # Authentication flow navigator
    │   │   ├── MainNavigator.tsx     # Main app navigator
    │   │   ├── BottomTabNavigator.tsx # Bottom tab navigation
    │   │   ├── MapStack.tsx          # Map screen stack
    │   │   ├── CompaniesStack.tsx    # Companies screen stack
    │   │   ├── ProfileStack.tsx      # Profile screen stack
    │   │   └── types.ts              # Navigation type definitions
    │   │
    │   ├── services/                  # API and business logic services
    │   │   ├── authService.ts        # Authentication API (mock/ready for backend)
    │   │   ├── icnDataService.ts     # ICN data loading and processing (1026 lines)
    │   │   ├── profileApi.ts         # User profile API operations
    │   │   ├── subscriptionApi.ts    # Subscription management API
    │   │   ├── geocodingService.ts   # Address geocoding with Google Maps API
    │   │   ├── geocodeCacheService.ts # Geocoding cache management
    │   │   ├── dataExportService.ts  # Data export (PDF/Excel)
    │   │   ├── paymentProcessor.ts   # Payment processing (Stripe-ready)
    │   │   └── mockSubscriptionApi.ts # Mock subscription data
    │   │
    │   ├── store/                     # Redux state management (future use)
    │   │   ├── index.ts              # Store configuration
    │   │   ├── companiesSlice.ts     # Company data state
    │   │   ├── searchSlice.ts        # Search state
    │   │   ├── portfolioSlice.ts     # Saved companies
    │   │   ├── notificationsSlice.ts # Notifications
    │   │   └── activitySlice.ts      # User activity tracking
    │   │
    │   ├── contexts/                  # React Context providers (primary state management)
    │   │   ├── UserContext.tsx       # User authentication and data
    │   │   ├── UserTierContext.tsx   # Subscription tier management
    │   │   ├── ProfileContext.tsx    # Profile management
    │   │   └── SettingsContext.tsx   # App settings and preferences
    │   │
    │   ├── types/                     # TypeScript definitions
    │   │   └── index.ts              # All type definitions (560+ lines)
    │   │                             #   - Company, ICNCompanyData, ICNItem
    │   │                             #   - User, Subscription, Filters
    │   │                             #   - CapabilityType, Navigation types
    │   │
    │   ├── hooks/                     # Custom React hooks
    │   │   ├── useICNData.ts         # ICN data fetching and filtering
    │   │   └── useSubscription.ts    # Subscription management
    │   │
    │   ├── utils/                     # Utility functions
    │   ├── constants/                 # App constants
    │   │   └── colors.ts             # Color palette and spacing
    │   │
    │   ├── effects/                   # Custom effects
    │   └── data/                      # Static/mock data
    │
    └── assets/                        # Static assets
        ├── icon.png                   # App icon (1024x1024)
        ├── splash-icon.png            # Splash screen
        ├── adaptive-icon.png          # Android adaptive icon
        ├── favicon.png                # Web favicon
        ├── ICN_Navigator.Company.json # ICN company database (local data source)
        ├── ICN Logo Source/           # ICN branding assets
        └── images/                    # Additional images
```

---

## Development

### Make Commands Reference

All development operations are managed through Make commands for consistency and ease of use.

#### Setup & Installation Commands
```bash
make setup          # Smart initial setup (idempotent, safe to rerun)
make rebuild        # Force rebuild Docker images (after Dockerfile changes)
make install        # Smart dependency install (skips if already done)
make reinstall      # Force reinstall all dependencies
make fix-expo       # Fix Expo SDK dependency conflicts
make clean-install  # Clean install with legacy peer deps
```

#### Development Commands
```bash
make dev            # Start development environment (foreground with logs)
make start          # Start Expo server (tunnel mode - recommended)
make start-lan      # Start Expo server (LAN mode - same Wi-Fi)
make start-localhost # Start Expo server (localhost - emulator only)
make android        # Run on Android emulator (requires Android Studio)
make ios            # Run on iOS simulator (requires Xcode, macOS only)
```

#### Utility Commands
```bash
make shell          # Open bash shell inside container
make logs           # View container logs (real-time)
make status         # Check container and environment status
make diagnose       # Run comprehensive diagnostics
```

#### Code Quality Commands
```bash
make lint           # Run ESLint checks
make format         # Format code with Prettier
make test           # Run Jest unit tests
```

#### Maintenance Commands
```bash
make clean          # Clean Docker resources (keeps images)
make clean-all      # Deep clean (removes images too)
make reset          # Emergency environment reset
make quick-start    # One-command: build + install + start
make help           # Show all available commands
```

### Typical Development Workflow

```bash
# Start your day
make dev                    # Start development server (shows logs)

# In another terminal, make changes to code
# Changes auto-reload via Expo Fast Refresh

# Run quality checks
make lint                   # Check code quality
make test                   # Run tests

# Debug issues
make logs                   # View detailed logs
make shell                  # Enter container for debugging
cd ICNNavigatorMobile && npx expo start --clear  # Clear cache

# End your day
# Press Ctrl+C in terminal running 'make dev'
```

---

## Environment Configuration

### Environment Variables Setup

The application requires environment variables, managed inside the Docker container.

#### Step-by-Step Configuration:

```bash
# 1. Enter container
make shell

# 2. Navigate to project
cd ICNNavigatorMobile

# 3. Create environment file from template
cp .env.example .env

# 4. Edit with your API keys
nano .env  # or use vim, or exit and edit on host machine
```

#### Environment Variables Reference:

```env
# ===== Backend API Configuration =====
# Note: Current version uses local JSON data, backend integration ready
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api

# ===== Google Services (REQUIRED) =====
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id

# ===== OAuth Providers (Optional) =====
EXPO_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id

# ===== Payment Integration (Optional) =====
EXPO_PUBLIC_STRIPE_KEY=your_stripe_publishable_key

# ===== Development Environment =====
NODE_ENV=development
```

### Obtaining Required API Keys

#### Google Maps API Key (REQUIRED)
The app will not function without this key, as it powers the map screen and geocoding.

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
   - **Geocoding API** (for address geocoding)
4. Create credentials → API Key
5. (Recommended) Restrict key to your bundle identifiers:
   - iOS: `com.icnvictoria.navigator`
   - Android: `com.icnvictoria.navigator`

#### Google OAuth Client ID (Optional)
For Google Sign-In functionality (currently configured but not required):

1. In Google Cloud Console, navigate to "Credentials"
2. Create OAuth 2.0 Client ID
3. Application type: "iOS" and "Android" (create separate IDs)
4. Enter bundle identifier: `com.icnvictoria.navigator`
5. Download configuration files

#### LinkedIn Client ID (Optional)
For LinkedIn authentication:

1. Visit [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create new app
3. Configure OAuth 2.0 settings
4. Add redirect URI: `icn-navigator://auth`
5. Copy Client ID

### Backend API Configuration

The app is designed to connect to an ICN Navigator backend API but currently operates with local JSON data.

| Platform | Default API Base URL |
|---------|---------------------|
| **Android Emulator** | `http://10.0.2.2:8080/api` |
| **iOS Simulator** | `http://localhost:8080/api` |
| **Physical Device** | Use your machine's local IP address |

**Note:** Current version loads ICN data from `assets/ICN_Navigator.Company.json` with full backend integration ready in the services layer.

---

## Architecture

### Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.tsx (Root)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Context Providers Stack                  │  │
│  │  • SafeAreaProvider  (React Native Safe Area Context)    │  │
│  │  • UserProvider      (Authentication & user data)        │  │
│  │  • ProfileProvider   (Profile management)                │  │
│  │  • SettingsProvider  (App settings & preferences)        │  │
│  │  • UserTierProvider  (Subscription tier & features)      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│                     AppNavigator (Root)                          │
│                              │                                   │
│              ┌───────────────┴───────────────┐                   │
│              │                               │                   │
│              ▼                               ▼                   │
│        AuthNavigator                  MainNavigator             │
│     (Unauthenticated)                 (Authenticated)           │
└─────────────────────────────────────────────────────────────────┘
```

### Navigation Structure

```
AppNavigator (Root)
│
├── AuthNavigator (Unauthenticated Flow)
│   ├── WelcomeScreen              # App introduction & onboarding
│   └── LoginSignUpResetScreen     # Unified authentication interface
│
└── MainNavigator (Authenticated Flow)
    │
    ├── BottomTabNavigator (Main Navigation)
    │   │
    │   ├── MapStack
    │   │   └── MapScreen          # Interactive Google Maps with company markers
    │   │
    │   ├── CompaniesStack
    │   │   ├── CompaniesScreen    # Company list with filters
    │   │   └── CompanyDetailScreen # Detailed company information
    │   │
    │   └── ProfileStack
    │       ├── ProfileScreen      # User profile & settings
    │       ├── EditProfileScreen  # Profile editing
    │       ├── ChangePasswordScreen # Password management
    │       └── ManageSubscriptionScreen # Subscription management
    │
    └── PaymentScreen (Modal)     # Payment processing overlay
```

### State Management Strategy

The app uses **React Context** as the primary state management solution, with **Redux Toolkit** available for future complex state needs.

#### Context Providers (Active)

**1. UserContext**
- User authentication state (login, logout, token management)
- User data (profile information, preferences)
- Authentication status checking
- Session persistence with AsyncStorage

**2. UserTierContext**
- Current subscription tier (Free, Plus, Premium)
- Feature access control based on tier
- Subscription information (status, expiry, auto-renew)
- Tier upgrade/downgrade operations

**3. ProfileContext**
- User profile CRUD operations
- Profile image management
- Profile data validation
- Profile update synchronization

**4. SettingsContext**
- App settings (notifications, privacy, data sync)
- User preferences (theme, language)
- Settings persistence
- Settings reset functionality

#### Redux Slices (Prepared for future use)
- `companiesSlice`: Company data caching and management
- `searchSlice`: Search history and filters
- `portfolioSlice`: Saved/bookmarked companies
- `notificationsSlice`: Notification management
- `activitySlice`: User activity tracking

### Data Flow

```
ICN Data Loading Flow:
┌─────────────────────────────────────────────────────────┐
│ 1. App Start                                            │
│    └─> icnDataService.loadData()                        │
│        └─> Load ICN_Navigator.Company.json (local)      │
│            └─> Parse 1000+ ICN items with companies     │
│                └─> Transform to unified Company type    │
│                    └─> Geocode addresses (cached)       │
│                        └─> Store in state               │
└─────────────────────────────────────────────────────────┘

Company Display Flow:
┌─────────────────────────────────────────────────────────┐
│ MapScreen / CompaniesScreen                             │
│    └─> useICNData hook                                  │
│        └─> Apply filters (sector, location, capability) │
│            └─> Sort companies                           │
│                └─> Render markers / cards               │
│                    └─> User selects company             │
│                        └─> Navigate to CompanyDetail    │
└─────────────────────────────────────────────────────────┘
```

### Services Architecture

**ICN Data Service** (`icnDataService.ts`)
- Primary data loader and processor
- Loads from local JSON file (`ICN_Navigator.Company.json`)
- Transforms ICN format to unified Company type
- Handles data validation and cleanup
- Provides filtering and search capabilities
- Manages sector, state, and capability data

**Geocoding Service** (`geocodingService.ts`)
- Integrates with Google Maps Geocoding API
- Converts addresses to coordinates
- Provides fallback coordinates for invalid addresses
- Batch geocoding for efficiency

**Geocode Cache Service** (`geocodeCacheService.ts`)
- Caches geocoding results using AsyncStorage
- Reduces API calls and improves performance
- Provides cache statistics
- Allows cache clearing

**Authentication Service** (`authService.ts`)
- User login, signup, logout operations
- Token management and validation
- OAuth integration ready (Google, LinkedIn)
- Session persistence

**Subscription API** (`subscriptionApi.ts`)
- Subscription tier management
- Payment processing integration (Stripe-ready)
- Feature access validation
- Subscription status checking

**Data Export Service** (`dataExportService.ts`)
- Export companies to PDF/Excel
- Tier-based export limits
- Custom export templates
- File sharing integration

---

## User Tiers

The app implements a three-tier subscription system with progressive feature unlocking.

### Tier Comparison

| Feature | Free | Plus ($4.99/mo) | Premium ($9.99/mo) |
|---------|------|-----------------|-------------------|
| **Company Browsing** | ✅ Full access | ✅ Full access | ✅ Full access |
| **Map View** | ✅ All companies | ✅ All companies | ✅ All companies |
| **Basic Filters** | ✅ Sector, Location | ✅ All filters | ✅ All filters |
| **Advanced Filters** | ❌ | ✅ Size, Certifications | ✅ All filters |
| **Bookmarks** | 1 folder | 1 folder | 10 folders |
| **Export Limit** | 10 companies | 50 companies | ♾️ Unlimited |
| **ABN Display** | ❌ | ✅ | ✅ |
| **Revenue Data** | ❌ | ❌ | ✅ |
| **Employee Count** | ❌ | ❌ | ✅ |
| **Local Content %** | ❌ | ❌ | ✅ |
| **ICN Chat Access** | ❌ | ✅ | ✅ |
| **Gateway Link** | ❌ | ✅ | ✅ |
| **Company Projects** | ❌ | ❌ | ✅ |
| **Recent News** | ❌ | ❌ | ✅ |
| **Full Export** | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ |

### Feature Access Control

Features are automatically gated based on the user's subscription tier through the `UserTierContext`:

```typescript
// Example: Feature access checking
const { features, checkFeatureAccess } = useUserTier();

// Check specific feature
if (features.canSeeABN) {
  // Display ABN
}

// Or use method
if (checkFeatureAccess('canExportFull')) {
  // Allow full export
}
```

### Subscription Management

Users can manage their subscriptions through the Profile screen:
1. View current tier and features
2. Compare tier benefits
3. Upgrade or downgrade subscription
4. View payment history
5. Manage auto-renewal settings

Payment processing is ready for Stripe integration through `paymentProcessor.ts`.

---

## Data Management

### ICN Database

The app operates on ICN Victoria's company database, stored locally as `ICN_Navigator.Company.json`.

**Data Structure:**
- **1000+ ICN Items/Capabilities** organized by sectors
- **2000+ Company-Capability relationships**
- **Multiple sectors**: Critical Minerals, Defence, Energy, Manufacturing, etc.
- **Geographic coverage**: Australia (VIC, NSW, QLD, SA, WA, NT, TAS, ACT) and New Zealand

**Company Information Includes:**
- Organization name and ID
- Complete address (street, city, state, postcode)
- Capabilities and capability types
- Sector mappings
- Validation dates
- ABN (tier-restricted)
- Geocoded coordinates (auto-generated on first load)

### Data Loading Process

1. **Initial Load**: On app startup, `icnDataService.loadData()` reads the JSON file
2. **Data Transformation**: ICN format converted to unified Company type
3. **Geocoding**: Addresses geocoded using Google Maps API (with caching)
4. **Validation**: Data validated and cleaned (handles invalid entries)
5. **Indexing**: Companies indexed by ID, sector, state, city, capabilities
6. **Caching**: Processed data and geocodes cached for performance

### Filtering System

**Available Filters:**
- **Sectors**: 20+ industry sectors (Critical Minerals, Defence, Energy, etc.)
- **States/Territories**: VIC, NSW, QLD, SA, WA, NT, TAS, ACT, NI, SI
- **Cities**: 100+ cities across Australia and New Zealand
- **Capabilities**: 1000+ specific capability items
- **Validation Status**: Verified companies only
- **Distance**: Proximity filtering (Premium feature)

**Filter Application:**
- Real-time filtering with immediate UI updates
- Multi-select support for all filter types
- "All" option to clear specific filter
- Filter persistence during session
- Filter count badges

### Search Functionality

**Search Capabilities:**
- **Company Names**: Fuzzy search across all company names
- **Capabilities**: Search by specific capability or item name
- **Sectors**: Search by sector/industry
- **Locations**: Search by city, state, or address

**Search Features:**
- Real-time search with dropdown suggestions
- Search history
- Search result highlighting
- Combined with filters for advanced queries

### Geocoding System

The app includes an intelligent geocoding system for map display:

**Features:**
- Google Maps Geocoding API integration
- Automatic address geocoding on first load
- Persistent geocoding cache (AsyncStorage)
- Fallback coordinates for invalid addresses
- Batch geocoding for efficiency
- Cache management and statistics

**Performance:**
- First run: ~5-10 minutes (geocoding all addresses)
- Subsequent runs: <5 seconds (from cache)
- Cache hit rate: ~95% after initial load
- Manual cache clearing available

---

## Testing

### Current Test Implementation

The app uses Jest and React Native Testing Library for testing. Test infrastructure is set up and ready.

**Test Configuration:**
- Jest configuration: `jest.config.js`
- Test setup: `src/__tests__/setup.ts`
- Babel configuration for testing: `babel.config.js`

### Running Tests

```bash
# Run all tests
make test

# Run tests in watch mode (inside container)
make shell
cd ICNNavigatorMobile
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

### Test Structure

Tests are co-located with source code in `__tests__/` directories:

```
src/
├── components/
│   └── common/
│       └── __tests__/
│           ├── CompanyCard.test.tsx
│           ├── SearchBar.test.tsx
│           └── FilterModal.test.tsx
├── navigation/
│   └── __tests__/
│       └── AppNavigator.test.tsx
└── hooks/
    └── __tests__/
        └── useICNData.test.ts
```

### Test Coverage Goals

- Components: 80%+ coverage
- Services: 90%+ coverage
- Hooks: 85%+ coverage
- Navigation: 75%+ coverage

---

## Deployment

### Build Configuration

The app is configured for EAS (Expo Application Services) Build with multiple profiles.

#### App Configuration (`app.json`)

```json
{
  "expo": {
    "name": "ICN Navigator",
    "slug": "icn-navigator-mobile",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.icnvictoria.navigator"
    },
    "android": {
      "package": "com.icnvictoria.navigator"
    }
  }
}
```

### Build Profiles

| Profile | Purpose | Use Case |
|---------|---------|----------|
| **development** | Development builds with DevClient | Internal team testing |
| **preview** | Beta testing | TestFlight / Internal Testing |
| **production** | App store release | Public distribution |

### Building for Production

#### Prerequisites
- Expo account ([Sign up](https://expo.dev/signup))
- EAS CLI installed in container

#### Build Steps

```bash
# 1. Enter container
make shell

# 2. Navigate to project
cd ICNNavigatorMobile

# 3. Login to Expo
npx eas login

# 4. Configure EAS
npx eas build:configure

# 5. Build for both platforms
npx eas build --platform all --profile production

# 6. Wait for build to complete (check dashboard)

# 7. Submit to app stores
npx eas submit --platform ios
npx eas submit --platform android
```

### App Store Submission

#### iOS App Store (App Store Connect)
1. Create app in App Store Connect
2. Bundle ID: `com.icnvictoria.navigator`
3. Upload build via EAS Submit or manually
4. Configure app information:
   - App name: ICN Navigator
   - Category: Business
   - Keywords: ICN, manufacturing, business, suppliers
5. Add screenshots and app preview video
6. Submit for review

#### Android Play Store (Google Play Console)
1. Create app in Google Play Console
2. Package name: `com.icnvictoria.navigator`
3. Upload AAB file via EAS Submit
4. Configure store listing:
   - App name: ICN Navigator
   - Short description (80 chars)
   - Full description (4000 chars)
5. Add screenshots (phone, tablet, optional)
6. Submit for review

### Version Management

Update version in `app.json` following semantic versioning:

```json
{
  "expo": {
    "version": "1.0.0",    // User-facing version
    "android": {
      "versionCode": 1      // Android build number (increment each build)
    },
    "ios": {
      "buildNumber": "1"    // iOS build number (increment each build)
    }
  }
}
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Container Won't Start
```bash
# Check Docker status
docker ps

# If container is not running
make clean
make setup
```

#### 2. Dependencies Installation Fails
```bash
# Clear and reinstall
make reinstall

# If issues persist
make clean-install
```

#### 3. Expo Connection Issues

**Can't connect to Metro bundler:**
```bash
# Try different connection modes
make start           # Tunnel mode (works across networks)
make start-lan       # LAN mode (faster, same Wi-Fi required)
make start-localhost # Localhost (emulator only)

# Clear Metro cache
make shell
cd ICNNavigatorMobile
npx expo start --clear
```

**QR code won't scan:**
- Ensure Expo Go app is installed and updated
- Check device and computer are on same network (LAN mode)
- Use tunnel mode if on different networks
- Check firewall isn't blocking ports 19000-19006

#### 4. Maps Not Displaying

**Black screen or "Google Maps not loaded":**
```bash
# Verify API key is set
make shell
cd ICNNavigatorMobile
cat .env | grep GOOGLE_MAPS

# Check Google Cloud Console:
# 1. Maps SDK for Android enabled
# 2. Maps SDK for iOS enabled  
# 3. Geocoding API enabled
# 4. API key restrictions (if any) include bundle IDs
```

#### 5. Geocoding Taking Too Long

**First-time load slow:**
- Normal behavior: ~5-10 minutes for initial geocoding
- Subsequent loads use cache: <5 seconds
- Clear cache if needed via Profile > Settings > Data Management

**Geocoding errors:**
```bash
# Check geocoding API quota
# Google Cloud Console > APIs & Services > Quotas
# Default: 50 requests/second

# If needed, clear corrupted cache
make shell
cd ICNNavigatorMobile
# In Expo Go app: Profile > Settings > Clear Cache
```

#### 6. App Crashes on Startup

**Check logs:**
```bash
# View container logs
make logs

# Check specific errors
make shell
cd ICNNavigatorMobile
npx expo start --clear
```

**Common causes:**
- Missing environment variables
- Corrupted node_modules (run `make reinstall`)
- Incompatible Expo SDK versions (run `make fix-expo`)
- JSON data file corrupted (check `assets/ICN_Navigator.Company.json`)

#### 7. Subscription Features Not Working

**Features not unlocking:**
- Check UserTierContext is properly initialized
- Verify tier is stored in AsyncStorage
- Clear app data and re-login
- Check console logs for errors

#### 8. Build Failures

**Android build issues:**
```bash
# Check Gradle wrapper
./gradlew --version

# Clear Gradle cache
rm -rf ~/.gradle/caches/
```

**iOS build issues:**
```bash
# Clear CocoaPods
cd ios && rm -rf Pods/ Podfile.lock
pod install

# Or use EAS Build (recommended)
npx eas build --platform ios --profile production
```

### Diagnostic Commands

```bash
# Check overall status
make status

# Run comprehensive diagnostics
make diagnose

# View live logs
make logs

# Check Node/npm versions
make shell
node --version  # Expected: v20.x
npm --version   # Expected: 10.x

# Check Expo CLI
npx expo --version

# Check project structure
ls -la ICNNavigatorMobile/
```

### Performance Issues

**Slow rendering:**
- Enable development mode optimizations
- Check for console warnings
- Verify React DevTools profiler results

**Slow map performance:**
- Reduce number of visible markers (use clustering)
- Verify marker clustering is enabled
- Check device performance (older devices may struggle)

**Memory issues:**
- Clear geocoding cache
- Restart Metro bundler with --reset-cache
- Restart Expo Go app

### Data Issues

**Companies not displaying:**
```bash
# Verify JSON file exists
make shell
cd ICNNavigatorMobile
ls -la assets/ICN_Navigator.Company.json

# Check file size (should be ~5-10MB)
du -h assets/ICN_Navigator.Company.json

# Validate JSON format
python3 -m json.tool assets/ICN_Navigator.Company.json > /dev/null
```

**Filters not working:**
- Check console for filter application errors
- Verify filter options are loaded (check `icnDataService`)
- Clear app state and refresh

### Emergency Reset

If all else fails, complete environment reset:

```bash
# Nuclear option
make down
make clean-all
rm -rf ICNNavigatorMobile/node_modules
rm -rf ICNNavigatorMobile/.expo
rm -rf ICNNavigatorMobile/package-lock.json
make setup
```

### Getting Help

**Before asking for help, gather this information:**
```bash
# System information
make diagnose

# Error logs
make logs > error.log

# Package versions
make shell
cd ICNNavigatorMobile
npm list --depth=0

# Environment
cat .env (remove sensitive data!)
```

---

## Additional Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Google Maps Platform](https://developers.google.com/maps)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### ICN Resources
- [ICN Victoria Website](https://icn.org.au/)
- [ICN Gateway Portal](https://gateway.icn.org.au/)
- ICN Contact: research@icn.vic.gov.au

### Developer Guidelines
See [DEV_GUIDELINES.md](./DEV_GUIDELINES.md) for detailed information on:
- Coding standards and conventions
- Architecture decisions and patterns
- Best practices for React Native development
- CI/CD workflows
- Testing strategies
- Performance optimization techniques

### Project Repository
- **GitHub**: [ITP-ICN-G05/ICN-Mobile](https://github.com/ITP-ICN-G05/ICN-Mobile)
- **Issues**: [GitHub Issues](https://github.com/ITP-ICN-G05/ICN-Mobile/issues)
- **Pull Requests**: [GitHub PRs](https://github.com/ITP-ICN-G05/ICN-Mobile/pulls)

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Project Information

| Item | Value |
|------|-------|
| **Version** | 1.0.0 |
| **Expo SDK** | ~54.0.6 |
| **React Native** | 0.81.4 |
| **TypeScript** | ~5.9.2 |
| **Node.js** | 20.x |
| **Bundle ID (iOS)** | `com.icnvictoria.navigator` |
| **Package (Android)** | `com.icnvictoria.navigator` |
| **Development** | Docker-based environment |
| **Primary Data Source** | Local JSON (`ICN_Navigator.Company.json`) |
| **Map Provider** | Google Maps Platform |

---

**For handover recipients:** This README provides comprehensive documentation for understanding, setting up, and maintaining the ICN Navigator Mobile application. For development workflows and coding standards, refer to [DEV_GUIDELINES.md](./DEV_GUIDELINES.md).

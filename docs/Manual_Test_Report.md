# Manual Test Report — ICN Navigator Mobile App

**Project:** ICN Navigator Mobile  
**Release / Sprint:** Sprint2 / V1.0.0
**Test Window:**    -   
**Prepared by:**  
**Reviewed by (not the author):** [Reviewer Name]  

## 1) Scope & Objectives

### Scope

**In Scope:**

- **Welcome Screen**: First-time user onboarding with page transitions and ICN branding
- **Companies Screen**: Complete listing with search, multi-filter, bookmarking, and sorting
  - List/Grid view modes with smooth animations
  - Real-time search across company names, addresses, and sectors
  - Multi-select capability filters and verification status filters
  - Bookmarking system with saved companies section
  - Statistics dashboard showing company counts
  - Pull-to-refresh functionality and loading states
- **Map Screen**: Google Maps integration with advanced features
  - Native Google Maps with company markers (color-coded by verification status)
  - Search with dropdown suggestions (up to 8 matching companies)
  - Interactive marker callouts with company details
  - "Search this area" functionality with region-based filtering
  - My location button and user location display
  - Filter system with visual feedback
- **Navigation**: Bottom tab navigation (Companies, Map, Profile)
- **Component Library**: Reusable UI components (SearchBar, FilterModal, CompanyCard)
- **Docker Development Environment**: Complete containerized development setup
- **Cross-platform compatibility**: iOS and Android support

**Out of Scope:**

- Authentication flows (OAuth integration not yet implemented)
- Backend API integration (using mock data currently)
- Company detail screen (basic placeholder implementation)
- Profile management features (placeholder screen only)
- Push notifications
- Deep linking functionality
- Performance testing under load
- Automated UI testing

### Objectives

Verify React Native mobile app functionality against user story acceptance criteria:

- **Welcome Screen**: Page transitions, branding, and first-time user experience
- **Companies Screen Functionality**:
  - Search performance across company data (names, addresses, sectors)
  - Multi-select filtering system (capabilities, distance, verification status)
  - View mode switching (list/grid) with smooth animations
  - Bookmarking system and saved companies management
  - Statistics accuracy and real-time updates
  - Pull-to-refresh and loading state handling
- **Map Integration**:
  - Google Maps rendering with company markers
  - Marker color-coding by verification status
  - Search dropdown with company suggestions
  - Interactive callouts and company selection
  - "Search this area" region-based filtering
  - User location and map navigation
- **Cross-platform Consistency**: UI/UX consistency between iOS and Android
- **Component Reusability**: Common components (SearchBar, FilterModal, CompanyCard)
- **Development Environment**: Docker containerization and Make command workflow
- **Performance**: Smooth animations, responsive UI, efficient data handling



## 2) Test Items & Environment



### Distribution

- **iOS:** Expo Go development
- **Android:** Expo Go development
- **Development:** Expo development server with hot reload

### Environment

- **Backend Environment**: Mock Data (no backend integration yet)
- **Data Source**: `src/data/mockCompanies.ts` with 20+ generated companies
- **API Simulation**: Local mock data with realistic company profiles
- **Google Services**: Google Maps API integration (requires API key)
- **Development Mode**: Expo development server with hot reload
- **Build System**: EAS Build for native features (react-native-maps)

### Device/OS Matrix

**Real Devices:**

- iOS: [iPhone models and iOS versions tested]
- Android: [Device models, Android API levels, OEM variants (Pixel/Samsung/etc.)]

**Simulators/Emulators:**

- iOS Simulator: [iOS versions]
- Android Emulator: [Android API levels]

### Network Conditions

- **Wi-Fi:** Stable broadband connection
- **Mobile Data:** 4G/5G cellular networks
- **Offline Mode:** [If implemented]
- **Network Throttling:** Good/Spotty/Lossy connection profiles
- **Captive Portal:** Public Wi-Fi scenarios

### Permissions Exercised

- **Location Services**: Required for map functionality and "My Location" feature
- **Network Access**: Required for Google Maps tiles and services
- **Notifications**: [Not implemented yet]
- **Camera/Photo Library**: [Not implemented yet]

### Test Data

- **Mock Companies**: Generated dataset of 20+ companies from `src/data/mockCompanies.ts`
- **Company Profiles**: Include name, address, verification status, sectors, and geolocation
- **Search Test Cases**: Various company names, addresses, and sector keywords
- **Filter Scenarios**: Different combinations of capabilities, verification status, and distance
- **Boundary Conditions**: Empty search results, maximum filter selections, edge cases
- **Bookmarking Data**: Simulate saved/unsaved company states

### Notes

[Any deviations from the original test plan]

## 3) Test Approach & Entry/Exit Criteria

### Approach

- **Manual UI Testing:** Screen-by-screen functional verification
- **Cross-Platform Testing:** iOS and Android consistency checks
- **Exploratory Testing:** User journey flows and edge cases
- **Integration Testing:** API connectivity and data flow validation
- **Responsive Design:** Multiple screen sizes and orientations
- **Documentation:** Screenshots for pass/fail evidence

### Entry Criteria

- ✅ Docker development environment stable (`make setup` completed successfully)
- ✅ Expo development server running (`make start` or `make dev`)
- ✅ Google Maps API key configured in environment
- ✅ Mock data loaded and accessible (`src/data/mockCompanies.ts`)
- ✅ Build deployable via EAS Build for native features (required for react-native-maps)
- ✅ Test devices/simulators configured and accessible
- ✅ No blocking linting errors (`make lint` passes)

### Exit Criteria

- ✅ All acceptance criteria tested and documented
- ✅ No Critical/High severity defects blocking release
- ✅ Cross-platform compatibility verified
- ✅ Evidence captured with screenshots/recordings
- ✅ Test report reviewed and approved
- ✅ Performance acceptable on target devices

## 4) Execution Summary

### Totals

- **Features Executed:** [X] out of [Y]
- **Fully Passed:** [X]
- **Partially Passed:** [X]
- **Failed:** [X]
- **Blocked:** [X]

### Defects Raised

- **Total Defects:** [X]
- **Critical:** [X] (App crashes, data loss, security issues)
- **High:** [X] (Major functionality broken, UX severely impacted)
- **Medium:** [X] (Minor functionality issues, cosmetic problems)
- **Low:** [X] (Enhancement requests, minor UI inconsistencies)

### Coverage

- **Acceptance Criteria Coverage:** [X]% of total AC tested
- **Platform Coverage:** iOS [X]% / Android [X]%
- **Screen Coverage:** [X] out of [Y] screens tested

## 4.1 Results by User Story

| User Story | Acceptance Criteria | Features Touched | Result | Notes |
| :--- | :--- | :--- | :--- | :--- |
| US1.1: Company Capability Database (Mock) | AC01: Company data structure with capabilities; AC02: Mock data generation (~20 companies); AC03: Single primary address per company | mockCompanies.ts, Company types, data structure | Partially-Pass | [Limited mock implementation - full database pending] |
| US1.2: Advanced Multi-Criteria Search | AC01: Multiple filter criteria (capabilities, sectors, verification); AC02: Real-time search across names/addresses; AC03: Filter combinations work together | CompaniesScreen search, FilterModal, multi-select filters | Partially-Pass | [Core search implemented, tier-based restrictions pending] |
| US1.3: Interactive Map Visualization | AC01: Google Maps with company markers; AC02: Real-time pan/zoom updates; AC03: Distance-based search; AC04: Map/table view toggle | MapScreen, react-native-maps, marker clustering, search area | Partially-Pass | [Core map features implemented, advanced clustering pending] |
| US1.4: Data Export (Basic) | AC01: Basic company information display; AC02: Shareable company details | Company detail views, mock data presentation | Not-yet-implemented | [Basic display only, export functionality not implemented] |
| US2.1: Cross-Platform Interface | AC01: React Native mobile app; AC02: Responsive design; AC03: Consistent UX across devices | App.tsx, cross-platform components, responsive layouts | Pass | [Mobile app implemented] |
| US2.2: User Account Management | AC01: User interface preparation; AC02: Tier-based access structure | Basic app structure, placeholder screens | Not-yet-implemented | [Authentication not implemented - placeholder only] |
| US2.4: Bookmarking System | AC01: Bookmark/unbookmark companies; AC02: Saved companies section; AC03: Bookmark persistence | CompaniesScreen bookmark functionality, saved section | Partially-Pass | [Basic bookmarking implemented, folders/tiers pending] |
| Welcome Screen Implementation | AC01: ICN branding display; AC02: Page transition animations; AC03: First-time user onboarding | WelcomeScreen, pageTransitions.ts, ICN assets | Pass | [Additional feature - onboarding implemented] |
| Navigation System | AC01: Bottom tab navigation; AC02: Screen persistence; AC03: Navigation consistency | Bottom Tab Navigator, screen components | Pass | [Core navigation implemented] |
| Docker Development Environment | AC01: Containerized development; AC02: Make command workflow; AC03: Hot reload functionality | Dockerfile, docker-compose.yml, Makefile | Pass | [Development environment fully implemented] |

## 5) Test Evidence

### Unit Test Examples (Based on ICN Navigator Mobile Code)

#### 1. Pure Logic Testing - Data Utilities

```typescript
// src/utils/__tests__/companyUtils.test.ts
import { filterCompaniesBySearch, sortCompaniesByName } from '../companyUtils';
import { Company } from '../../types';

describe('Company Utilities', () => {
  const mockCompanies: Company[] = [
    {
      id: '1',
      name: 'ABC Construction Ltd',
      address: '123 Smith Street, Melbourne, VIC 3000',
      verificationStatus: 'verified',
      keySectors: ['Supplier', 'Construction'],
      latitude: -37.8136,
      longitude: 144.9631,
    },
    {
      id: '2', 
      name: 'XYZ Engineering',
      address: '456 Collins Street, Melbourne, VIC 3000',
      verificationStatus: 'unverified',
      keySectors: ['Engineering', 'Consulting'],
      latitude: -37.8140,
      longitude: 144.9633,
    }
  ];

  describe('filterCompaniesBySearch', () => {
    it('should filter companies by name (case insensitive)', () => {
      const result = filterCompaniesBySearch(mockCompanies, 'abc');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('ABC Construction Ltd');
    });

    it('should filter companies by address', () => {
      const result = filterCompaniesBySearch(mockCompanies, 'Collins');
      expect(result).toHaveLength(1);
      expect(result[0].address).toContain('Collins Street');
    });

    it('should filter companies by sectors', () => {
      const result = filterCompaniesBySearch(mockCompanies, 'Engineering');
      expect(result).toHaveLength(1);
      expect(result[0].keySectors).toContain('Engineering');
    });

    it('should return empty array for no matches', () => {
      const result = filterCompaniesBySearch(mockCompanies, 'NonexistentTerm');
      expect(result).toHaveLength(0);
    });
  });

  describe('sortCompaniesByName', () => {
    it('should sort companies alphabetically by name', () => {
      const result = sortCompaniesByName([...mockCompanies]);
      expect(result[0].name).toBe('ABC Construction Ltd');
      expect(result[1].name).toBe('XYZ Engineering');
    });
  });
});
```

#### 2. Component Testing - CompanyCard

```typescript
// src/components/common/__tests__/CompanyCard.test.tsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import CompanyCard from '../CompanyCard';
import { Company } from '../../../types';

describe('CompanyCard Component', () => {
  const mockCompany: Company = {
    id: '1',
    name: 'Test Company',
    address: '123 Test Street, Melbourne, VIC 3000',
    verificationStatus: 'verified',
    verificationDate: '2025-01-07',
    keySectors: ['Supplier', 'Manufacturing'],
    latitude: -37.8136,
    longitude: 144.9631,
  };

  const mockOnPress = jest.fn();
  const mockOnBookmark = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render company name and address', () => {
      render(<CompanyCard company={mockCompany} onPress={mockOnPress} />);
      
      expect(screen.getByText('Test Company')).toBeTruthy();
      expect(screen.getByText('123 Test Street, Melbourne, VIC 3000')).toBeTruthy();
    });

    it('should render first letter of company name as avatar', () => {
      render(<CompanyCard company={mockCompany} onPress={mockOnPress} />);
      
      expect(screen.getByText('T')).toBeTruthy(); // First letter of "Test Company"
    });

    it('should show verified badge for verified companies', () => {
      render(<CompanyCard company={mockCompany} onPress={mockOnPress} />);
      
      expect(screen.getByText('Verified on 2025-01-07')).toBeTruthy();
    });

    it('should not show verified badge for unverified companies', () => {
      const unverifiedCompany = { ...mockCompany, verificationStatus: 'unverified' as const };
      render(<CompanyCard company={unverifiedCompany} onPress={mockOnPress} />);
      
      expect(screen.queryByText(/Verified on/)).toBeNull();
    });
  });

  describe('Interactive Behavior', () => {
    it('should call onPress when card is pressed', () => {
      render(<CompanyCard company={mockCompany} onPress={mockOnPress} />);
      
      fireEvent.press(screen.getByTestId('company-card') || screen.getByText('Test Company'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should render bookmark button when onBookmark is provided', () => {
      render(
        <CompanyCard 
          company={mockCompany} 
          onPress={mockOnPress} 
          onBookmark={mockOnBookmark}
          isBookmarked={false}
        />
      );
      
      expect(screen.getByTestId('bookmark-button')).toBeTruthy();
    });

    it('should call onBookmark when bookmark button is pressed', () => {
      render(
        <CompanyCard 
          company={mockCompany} 
          onPress={mockOnPress} 
          onBookmark={mockOnBookmark}
          isBookmarked={false}
        />
      );
      
      fireEvent.press(screen.getByTestId('bookmark-button'));
      expect(mockOnBookmark).toHaveBeenCalledTimes(1);
    });

    it('should show filled bookmark icon when isBookmarked is true', () => {
      render(
        <CompanyCard 
          company={mockCompany} 
          onPress={mockOnPress} 
          onBookmark={mockOnBookmark}
          isBookmarked={true}
        />
      );
      
      // This would test the icon name prop, implementation depends on test setup
      expect(screen.getByTestId('bookmark-icon-filled')).toBeTruthy();
    });
  });

  describe('Conditional Rendering', () => {
    it('should not render bookmark button when onBookmark is not provided', () => {
      render(<CompanyCard company={mockCompany} onPress={mockOnPress} />);
      
      expect(screen.queryByTestId('bookmark-button')).toBeNull();
    });

    it('should handle missing verification date gracefully', () => {
      const companyWithoutDate = { ...mockCompany, verificationDate: undefined };
      render(<CompanyCard company={companyWithoutDate} onPress={mockOnPress} />);
      
      expect(screen.getByText('Verified on 1/07/2025')).toBeTruthy(); // Default date
    });
  });
});
```

#### 3. Custom Hook Testing - Search Logic

```typescript
// src/hooks/__tests__/useCompanySearch.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useCompanySearch } from '../useCompanySearch';
import { Company } from '../../types';

describe('useCompanySearch Hook', () => {
  const mockCompanies: Company[] = [
    {
      id: '1',
      name: 'ABC Construction Ltd',
      address: '123 Smith Street, Melbourne',
      verificationStatus: 'verified',
      keySectors: ['Construction'],
      latitude: -37.8136,
      longitude: 144.9631,
    },
    {
      id: '2',
      name: 'XYZ Engineering',
      address: '456 Collins Street, Melbourne',
      verificationStatus: 'unverified',
      keySectors: ['Engineering'],
      latitude: -37.8140,
      longitude: 144.9633,
    }
  ];

  it('should initialize with empty search and all companies', () => {
    const { result } = renderHook(() => useCompanySearch(mockCompanies));
    
    expect(result.current.searchText).toBe('');
    expect(result.current.filteredCompanies).toHaveLength(2);
  });

  it('should filter companies when search text changes', () => {
    const { result } = renderHook(() => useCompanySearch(mockCompanies));
    
    act(() => {
      result.current.setSearchText('ABC');
    });
    
    expect(result.current.searchText).toBe('ABC');
    expect(result.current.filteredCompanies).toHaveLength(1);
    expect(result.current.filteredCompanies[0].name).toBe('ABC Construction Ltd');
  });

  it('should apply filters correctly', () => {
    const { result } = renderHook(() => useCompanySearch(mockCompanies));
    
    act(() => {
      result.current.setFilters({
        capabilities: ['Construction'],
        distance: 'All',
        verificationStatus: 'verified'
      });
    });
    
    expect(result.current.filteredCompanies).toHaveLength(1);
    expect(result.current.filteredCompanies[0].verificationStatus).toBe('verified');
  });

  it('should combine search text and filters', () => {
    const { result } = renderHook(() => useCompanySearch(mockCompanies));
    
    act(() => {
      result.current.setSearchText('Engineering');
      result.current.setFilters({
        capabilities: [],
        distance: 'All',
        verificationStatus: 'unverified'
      });
    });
    
    expect(result.current.filteredCompanies).toHaveLength(1);
    expect(result.current.filteredCompanies[0].name).toBe('XYZ Engineering');
  });
});
```

#### 4. SearchBar Component Testing

```typescript
// src/components/common/__tests__/SearchBar.test.tsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import SearchBar from '../SearchBar';

describe('SearchBar Component', () => {
  const mockOnChangeText = jest.fn();
  const mockOnFilter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default placeholder', () => {
      render(<SearchBar value="" onChangeText={mockOnChangeText} />);
      
      expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
    });

    it('should render with custom placeholder', () => {
      render(
        <SearchBar 
          value="" 
          onChangeText={mockOnChangeText} 
          placeholder="Search companies..."
        />
      );
      
      expect(screen.getByPlaceholderText('Search companies...')).toBeTruthy();
    });

    it('should display current value', () => {
      render(<SearchBar value="ABC Company" onChangeText={mockOnChangeText} />);
      
      expect(screen.getByDisplayValue('ABC Company')).toBeTruthy();
    });

    it('should render filter button when onFilter is provided', () => {
      render(
        <SearchBar 
          value="" 
          onChangeText={mockOnChangeText} 
          onFilter={mockOnFilter}
        />
      );
      
      expect(screen.getByTestId('filter-button')).toBeTruthy();
    });

    it('should not render filter button when onFilter is not provided', () => {
      render(<SearchBar value="" onChangeText={mockOnChangeText} />);
      
      expect(screen.queryByTestId('filter-button')).toBeNull();
    });
  });

  describe('Interactive Behavior', () => {
    it('should call onChangeText when text input changes', () => {
      render(<SearchBar value="" onChangeText={mockOnChangeText} />);
      
      fireEvent.changeText(screen.getByPlaceholderText('Search...'), 'New Search');
      expect(mockOnChangeText).toHaveBeenCalledWith('New Search');
    });

    it('should call onFilter when filter button is pressed', () => {
      render(
        <SearchBar 
          value="" 
          onChangeText={mockOnChangeText} 
          onFilter={mockOnFilter}
        />
      );
      
      fireEvent.press(screen.getByTestId('filter-button'));
      expect(mockOnFilter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(
        <SearchBar 
          value="" 
          onChangeText={mockOnChangeText} 
          onFilter={mockOnFilter}
        />
      );
      
      expect(screen.getByLabelText('Search input')).toBeTruthy();
      expect(screen.getByLabelText('Filter companies')).toBeTruthy();
    });
  });
});
```

### Test Design Approach Examples

#### White-box Testing (Branch Coverage)

```typescript
// Testing all code paths in a validation function
describe('validateCompanyData (White-box)', () => {
  it('should return error for empty name', () => {
    const company = { name: '', address: 'Valid Address' };
    expect(validateCompanyData(company).isValid).toBe(false);
    expect(validateCompanyData(company).errors).toContain('Name is required');
  });

  it('should return error for empty address', () => {
    const company = { name: 'Valid Name', address: '' };
    expect(validateCompanyData(company).isValid).toBe(false);
  });

  it('should return valid for complete data', () => {
    const company = { name: 'Valid Name', address: 'Valid Address' };
    expect(validateCompanyData(company).isValid).toBe(true);
  });
});
```

#### Black-box Testing (Public API)

```typescript
// Testing component behavior without knowing internal implementation
describe('CompanyCard (Black-box)', () => {
  it('should behave correctly for valid company data', () => {
    const onPress = jest.fn();
    render(<CompanyCard company={validCompany} onPress={onPress} />);
    
    // Test public behavior only
    expect(screen.getByText(validCompany.name)).toBeTruthy();
    fireEvent.press(screen.getByTestId('company-card'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

#### TDD Example (Test-First Approach)

```typescript
// 1. Write failing test first
describe('calculateDistance', () => {
  it('should calculate distance between two points', () => {
    const point1 = { lat: -37.8136, lng: 144.9631 };
    const point2 = { lat: -37.8140, lng: 144.9633 };
    
    // This will fail initially
    expect(calculateDistance(point1, point2)).toBeCloseTo(0.05, 2);
  });
});

// 2. Implement minimal code to pass
function calculateDistance(p1, p2) {
  // Minimal implementation
  return 0.05;
}

// 3. Refactor with proper implementation
function calculateDistance(p1, p2) {
  const R = 6371; // Earth's radius in km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  // ... proper calculation
  return distance;
}
```

### Screenshots

[Organize by feature/screen with pass/fail evidence]

- Welcome Screen: Page transitions and branding
- Companies Screen: List/Grid views, search results, filter modal, bookmarked section
- Map Screen: Company markers, search dropdown, callouts, "my location"
- Navigation: Tab switching, screen persistence

### Screen Recordings

[Videos of critical user flows and any defects found]

- Complete user journey: Welcome → Companies → Search → Map → Bookmark
- Animation testing: Page transitions, view mode switching, filter animations
- Map interactions: Search dropdown, marker selection, area search
- Performance testing: Large dataset handling, smooth scrolling

### Performance Metrics

- **App Startup Time**: [X] seconds (from splash to main screen)
- **Companies Screen Load Time**: [X] seconds (20+ companies with mock data)
- **Search Response Time**: [X] milliseconds (real-time search performance)
- **Map Rendering Time**: [X] seconds (Google Maps with 20+ markers)
- **View Mode Switch Time**: [X] milliseconds (list to grid transition)
- **Filter Application Time**: [X] milliseconds (filter modal to results)
- **Navigation Smoothness**: [60 FPS target for tab switching]
- **Animation Performance**: Page transitions, layout animations, bookmark toggles


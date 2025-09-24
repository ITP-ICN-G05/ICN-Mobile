// services/icnDataService.ts - Complete version with proper capability type handling
import { Company, ICNItem, ICNCompanyData, CapabilityType, isValidCapabilityType } from '../types';
import { Platform } from 'react-native';
import { geocodeAddress, getFallbackCoordinates, batchGeocodeAddresses } from './geocodingService';
import geocodeCacheService from './geocodeCacheService';

// Import the JSON file from assets folder
import ICNData from '../../assets/ICN_Navigator.Company.json';

// Define all capability types found in the data
const CAPABILITY_TYPES = {
  SUPPLIER: 'Supplier' as CapabilityType,
  ITEM_SUPPLIER: 'Item Supplier' as CapabilityType,
  PARTS_SUPPLIER: 'Parts Supplier' as CapabilityType,
  MANUFACTURER: 'Manufacturer' as CapabilityType,
  MANUFACTURER_PARTS: 'Manufacturer (Parts)' as CapabilityType,
  SERVICE_PROVIDER: 'Service Provider' as CapabilityType,
  PROJECT_MANAGEMENT: 'Project Management' as CapabilityType,
  DESIGNER: 'Designer' as CapabilityType,
  ASSEMBLER: 'Assembler' as CapabilityType,
  RETAILER: 'Retailer' as CapabilityType,
  WHOLESALER: 'Wholesaler' as CapabilityType
} as const;

// Group capability types for filtering - with proper type assertions
const CAPABILITY_TYPE_GROUPS: Record<string, CapabilityType[]> = {
  supplier: [
    CAPABILITY_TYPES.SUPPLIER,
    CAPABILITY_TYPES.ITEM_SUPPLIER,
    CAPABILITY_TYPES.PARTS_SUPPLIER
  ] as CapabilityType[],
  manufacturer: [
    CAPABILITY_TYPES.MANUFACTURER,
    CAPABILITY_TYPES.MANUFACTURER_PARTS,
    CAPABILITY_TYPES.ASSEMBLER
  ] as CapabilityType[],
  service: [
    CAPABILITY_TYPES.SERVICE_PROVIDER,
    CAPABILITY_TYPES.PROJECT_MANAGEMENT,
    CAPABILITY_TYPES.DESIGNER
  ] as CapabilityType[],
  retail: [
    CAPABILITY_TYPES.RETAILER,
    CAPABILITY_TYPES.WHOLESALER
  ] as CapabilityType[]
};

// State/Territory Codes for Australia and New Zealand ONLY
const STANDARD_STATES_TERRITORIES = [
  'VIC', 'NSW', 'QLD', 'SA', 'WA', 'NT', 'TAS', 'ACT',
  'NI', 'SI'
];

const AUSTRALIAN_STATES = ['VIC', 'NSW', 'QLD', 'SA', 'WA', 'NT', 'TAS', 'ACT'];
const NEW_ZEALAND_TERRITORIES = ['NI', 'SI'];
const ALL_VALID_REGIONS = STANDARD_STATES_TERRITORIES;

// State/territory mapping
const STATE_TERRITORY_MAP: Record<string, string> = {
  'victoria': 'VIC',
  'new south wales': 'NSW',
  'queensland': 'QLD', 
  'south australia': 'SA',
  'western australia': 'WA',
  'northern territory': 'NT',
  'tasmania': 'TAS',
  'australian capital territory': 'ACT',
  'vic.': 'VIC', 'nsw.': 'NSW', 'qld.': 'QLD', 'sa.': 'SA',
  'wa.': 'WA', 'nt.': 'NT', 'tas.': 'TAS', 'act.': 'ACT',
  'melbourne': 'VIC', 'sydney': 'NSW', 'brisbane': 'QLD',
  'adelaide': 'SA', 'perth': 'WA', 'darwin': 'NT',
  'hobart': 'TAS', 'canberra': 'ACT',
  'north island': 'NI', 'south island': 'SI',
  'auckland': 'NI', 'wellington': 'NI', 'christchurch': 'SI',
  'qkd': 'QLD', 'qld ': 'QLD'
};

// Typo corrections
const TYPO_CORRECTIONS: Record<string, string> = {
  'VUC': 'VIC', 'VOC': 'VIC', 'VIS': 'VIC',
  'MSW': 'NSW', 'NWS': 'NSW', 'NSE': 'NSW',
  'QKD': 'QLD', 'QLS': 'QLD', 'QLF': 'QLD',
  'SAA': 'SA', 'SAS': 'SA', 'AS': 'SA',
  'WAA': 'WA', 'WWA': 'WA', 'QA': 'WA',
  'NTT': 'NT', 'NNT': 'NT', 'MT': 'NT',
  'TAZ': 'TAS', 'TQS': 'TAS', 'TSA': 'TAS',
  'AXT': 'ACT', 'SCT': 'ACT', 'ACY': 'ACT'
};

// Data corrections
const DATA_CORRECTIONS: Record<string, any> = {
  cities: {
    'Melb': 'Melbourne', 'Syd': 'Sydney', 'Bris': 'Brisbane',
    'Adel': 'Adelaide', 'Pert': 'Perth', 'Darwn': 'Darwin',
    'Hobar': 'Hobart', 'Canbera': 'Canberra'
  }
};

// Utility functions
function isInvalidValue(value: string | undefined | null): boolean {
  if (!value) return true;
  const cleanValue = value.trim().toUpperCase();
  return cleanValue === '' || 
         cleanValue === '#N/A' || 
         cleanValue === 'N/A' || 
         cleanValue === '0' ||
         cleanValue === 'NULL' ||
         cleanValue === 'UNDEFINED';
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

function findClosestState(input: string): string | null {
  const upperInput = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (STANDARD_STATES_TERRITORIES.includes(upperInput)) {
    return upperInput;
  }
  
  if (TYPO_CORRECTIONS[upperInput]) {
    return TYPO_CORRECTIONS[upperInput];
  }
  
  let minDistance = Infinity;
  let closestState = null;
  
  for (const state of STANDARD_STATES_TERRITORIES) {
    const distance = levenshteinDistance(upperInput, state);
    if (distance <= 3 && distance < minDistance) {
      minDistance = distance;
      closestState = state;
    }
  }
  
  return closestState;
}

function getDefaultStateForUnknown(input: string): string {
  const lower = input.toLowerCase();
  
  if (lower.includes('mine') || lower.includes('mining')) return 'WA';
  if (lower.includes('tech') || lower.includes('it')) return 'VIC';
  if (lower.includes('finance') || lower.includes('bank')) return 'NSW';
  if (lower.includes('tourism') || lower.includes('resort')) return 'QLD';
  
  return 'NSW';
}

function normalizeStateTerritory(state: string | undefined | null): string | null {
  if (!state || isInvalidValue(state)) {
    return 'NSW';
  }
  
  const cleaned = state.trim().toLowerCase();
  const normalized = cleaned
    .replace(/^(state of |territory of |province of )/i, '')
    .replace(/( state| territory| province)$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  
  const mapped = STATE_TERRITORY_MAP[normalized] || STATE_TERRITORY_MAP[cleaned];
  if (mapped) return mapped;
  
  const upper = state.trim().toUpperCase();
  if (STANDARD_STATES_TERRITORIES.includes(upper)) return upper;
  
  const fuzzyMatch = findClosestState(upper);
  if (fuzzyMatch) return fuzzyMatch;
  
  for (const [key, value] of Object.entries(STATE_TERRITORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  return getDefaultStateForUnknown(state);
}

// Normalize capability type - returns CapabilityType
function normalizeCapabilityType(type: string | undefined | null): CapabilityType {
  if (!type || isInvalidValue(type)) {
    return CAPABILITY_TYPES.SERVICE_PROVIDER;
  }

  const cleanType = type.trim();
  
  // Check if it's already a valid type
  if (isValidCapabilityType && isValidCapabilityType(cleanType)) {
    return cleanType as CapabilityType;
  }
  
  // Map common variations
  const typeMap: Record<string, CapabilityType> = {
    'supplier': CAPABILITY_TYPES.SUPPLIER,
    'item supplier': CAPABILITY_TYPES.ITEM_SUPPLIER,
    'parts supplier': CAPABILITY_TYPES.PARTS_SUPPLIER,
    'manufacturer': CAPABILITY_TYPES.MANUFACTURER,
    'manufacturer (parts)': CAPABILITY_TYPES.MANUFACTURER_PARTS,
    'service provider': CAPABILITY_TYPES.SERVICE_PROVIDER,
    'project management': CAPABILITY_TYPES.PROJECT_MANAGEMENT,
    'designer': CAPABILITY_TYPES.DESIGNER,
    'assembler': CAPABILITY_TYPES.ASSEMBLER,
    'retailer': CAPABILITY_TYPES.RETAILER,
    'wholesaler': CAPABILITY_TYPES.WHOLESALER
  };
  
  const normalized = cleanType.toLowerCase();
  return typeMap[normalized] || CAPABILITY_TYPES.SERVICE_PROVIDER;
}

// Determine company type based on capability types
function determineCompanyType(capabilityTypes: CapabilityType[]): Company['companyType'] {
  const hasSupplier = capabilityTypes.some(type => 
    (CAPABILITY_TYPE_GROUPS.supplier as readonly CapabilityType[]).includes(type)
  );
  const hasManufacturer = capabilityTypes.some(type => 
    (CAPABILITY_TYPE_GROUPS.manufacturer as readonly CapabilityType[]).includes(type)
  );
  const hasService = capabilityTypes.some(type => 
    (CAPABILITY_TYPE_GROUPS.service as readonly CapabilityType[]).includes(type)
  );
  const hasRetail = capabilityTypes.some(type => 
    (CAPABILITY_TYPE_GROUPS.retail as readonly CapabilityType[]).includes(type)
  );
  
  if (hasManufacturer && hasSupplier) {
    return 'both';
  } else if (hasManufacturer) {
    return 'manufacturer';
  } else if (hasSupplier) {
    return 'supplier';
  } else if (hasService) {
    return 'service';
  } else if (hasRetail) {
    return 'retail';
  } else {
    return 'supplier';
  }
}

function autoCorrectData(value: string, type: 'city' | 'sector' | 'capability'): string {
  if (!value) return value;
  
  const corrections = type === 'city' ? DATA_CORRECTIONS.cities : {};
  
  for (const [wrong, correct] of Object.entries(corrections)) {
    if (value.toLowerCase() === wrong.toLowerCase()) {
      return correct as string;
    }
  }
  
  return value;
}

function cleanCompanyData(data: string | undefined | null, placeholder: string = 'Not Available'): string {
  if (isInvalidValue(data)) {
    return placeholder;
  }
  return data!.trim();
}

function convertICNDateToISO(icnDate: string): string | undefined {
  if (!icnDate || isInvalidValue(icnDate)) return undefined;
  
  const parts = icnDate.split('/');
  if (parts.length !== 3) return undefined;
  
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];
  
  return `${year}-${month}-${day}`;
}

function stratifiedSampleCompanies(companies: Company[], targetSize: number = 300): Company[] {
  console.log(`Starting stratified sampling from ${companies.length} companies to ${targetSize}`);
  
  if (companies.length <= targetSize) {
    return companies;
  }
  
  const companiesByState = new Map<string, Company[]>();
  const companiesBySector = new Map<string, Company[]>();
  const selectedCompanies = new Set<string>();
  const result: Company[] = [];
  
  companies.forEach(company => {
    const state = company.billingAddress?.state;
    if (state && STANDARD_STATES_TERRITORIES.includes(state)) {
      if (!companiesByState.has(state)) {
        companiesByState.set(state, []);
      }
      companiesByState.get(state)!.push(company);
    }
    
    company.keySectors.forEach(sector => {
      if (sector !== 'General') {
        if (!companiesBySector.has(sector)) {
          companiesBySector.set(sector, []);
        }
        companiesBySector.get(sector)!.push(company);
      }
    });
  });
  
  // Ensure at least one company from each state
  companiesByState.forEach((stateCompanies, state) => {
    if (selectedCompanies.size < targetSize && stateCompanies.length > 0) {
      const randomIndex = Math.floor(Math.random() * stateCompanies.length);
      const company = stateCompanies[randomIndex];
      if (!selectedCompanies.has(company.id)) {
        selectedCompanies.add(company.id);
        result.push(company);
      }
    }
  });
  
  // Ensure at least one company from each sector
  companiesBySector.forEach((sectorCompanies, sector) => {
    if (selectedCompanies.size < targetSize) {
      const unselected = sectorCompanies.filter(c => !selectedCompanies.has(c.id));
      if (unselected.length > 0) {
        const randomIndex = Math.floor(Math.random() * unselected.length);
        const company = unselected[randomIndex];
        selectedCompanies.add(company.id);
        result.push(company);
      }
    }
  });
  
  // Fill remaining slots randomly
  const remaining = targetSize - result.length;
  if (remaining > 0) {
    const unselectedCompanies = companies.filter(c => !selectedCompanies.has(c.id));
    const shuffled = [...unselectedCompanies].sort(() => Math.random() - 0.5);
    const additionalCompanies = shuffled.slice(0, remaining);
    additionalCompanies.forEach(company => {
      selectedCompanies.add(company.id);
      result.push(company);
    });
  }
  
  return result;
}

async function convertICNDataToCompanies(icnItems: ICNItem[], useSampling: boolean = true): Promise<Company[]> {
  const companyMap = new Map<string, Company>();
  let skippedCount = 0;
  
  icnItems.forEach(item => {
    if (isInvalidValue(item["Sector Name"]) && isInvalidValue(item["Item Name"])) {
      skippedCount++;
      return;
    }
    
    item.Organizations.forEach(org => {
      const orgId = org["Organisation: Organisation ID"];
      
      if (!orgId || isInvalidValue(orgId)) {
        skippedCount++;
        return;
      }
      
      if (!companyMap.has(orgId)) {
        const normalizedState = normalizeStateTerritory(org["Organisation: Billing State/Province"]);
        const street = cleanCompanyData(org["Organisation: Billing Street"], 'Address Not Available');
        let city = cleanCompanyData(org["Organisation: Billing City"], 'City Not Available');
        city = autoCorrectData(city, 'city');
        const postcode = cleanCompanyData(org["Organisation: Billing Zip/Postal Code"], '');
        
        const companyName = cleanCompanyData(org["Organisation: Organisation Name"], `Company ${orgId.slice(-4)}`);
        const fullAddress = [street, city, normalizedState, postcode]
          .filter(v => v && v !== '')
          .join(', ');
        
        // Normalize capability type to ensure it's a valid CapabilityType
        const capabilityType = normalizeCapabilityType(org["Capability Type"]);
        
        // Collect all capability types for this company
        const companyCapabilityTypes = [capabilityType];
        const companyType = determineCompanyType(companyCapabilityTypes);
        
        const verificationDate = convertICNDateToISO(org["Validation Date"]);
        const sectorName = cleanCompanyData(item["Sector Name"], 'General');
        const itemName = cleanCompanyData(item["Item Name"], 'Service');
        const detailedItemName = cleanCompanyData(item["Detailed Item Name"], itemName);
        
        companyMap.set(orgId, {
          id: orgId,
          name: companyName,
          address: fullAddress || 'Address Not Available',
          billingAddress: {
            street,
            city,
            state: normalizedState!,
            postcode
          },
          latitude: 0,
          longitude: 0,
          verificationStatus: verificationDate ? 'verified' : 'unverified',
          verificationDate,
          keySectors: [sectorName],
          capabilities: [detailedItemName],
          companyType,
          icnCapabilities: [{
            capabilityId: org["Organisation Capability"],
            itemId: item["Item ID"],
            itemName,
            detailedItemName,
            capabilityType, // This is now guaranteed to be CapabilityType
            sectorName,
            sectorMappingId: item["Sector Mapping ID"]
          }],
          dataSource: 'ICN',
          icnValidationDate: org["Validation Date"],
          lastUpdated: new Date().toISOString(),
          phoneNumber: undefined,
          email: undefined,
          website: undefined,
        } as Company);
      } else {
        const existingCompany = companyMap.get(orgId)!;
        const sectorName = cleanCompanyData(item["Sector Name"], 'General');
        const detailedItemName = cleanCompanyData(item["Detailed Item Name"], 'Service');
        const capabilityType = normalizeCapabilityType(org["Capability Type"]);
        
        if (!existingCompany.keySectors.includes(sectorName)) {
          existingCompany.keySectors.push(sectorName);
        }
        
        if (existingCompany.capabilities && 
            !existingCompany.capabilities.includes(detailedItemName)) {
          existingCompany.capabilities.push(detailedItemName);
        }
        
        if (existingCompany.icnCapabilities) {
          existingCompany.icnCapabilities.push({
            capabilityId: org["Organisation Capability"],
            itemId: item["Item ID"],
            itemName: cleanCompanyData(item["Item Name"], 'Service'),
            detailedItemName,
            capabilityType, // This is now guaranteed to be CapabilityType
            sectorName,
            sectorMappingId: item["Sector Mapping ID"]
          });
        }
        
        // Update company type based on all capability types
        if (existingCompany.icnCapabilities) {
          const allCapTypes = existingCompany.icnCapabilities.map(c => c.capabilityType);
          existingCompany.companyType = determineCompanyType(allCapTypes);
        }
      }
    });
  });
  
  let allCompanies = Array.from(companyMap.values());
  console.log(`Processed ${allCompanies.length} unique companies before sampling`);
  
  let companiesToProcess = allCompanies;
  if (useSampling) {
    companiesToProcess = stratifiedSampleCompanies(allCompanies, 300);
    console.log(`Sampled ${companiesToProcess.length} companies for geocoding`);
  }
  
  const companiesToGeocode = companiesToProcess.map(company => ({
    orgId: company.id,
    street: company.billingAddress?.street || '',
    city: company.billingAddress?.city || '',
    state: company.billingAddress?.state || 'NSW',
    postcode: company.billingAddress?.postcode || ''
  }));
  
  const coordinates = await geocodeCacheService.batchGeocodeWithCache(companiesToGeocode);
  
  companiesToGeocode.forEach((company, index) => {
    const coords = coordinates[index];
    const companyData = companiesToProcess.find(c => c.id === company.orgId);
    if (companyData) {
      companyData.latitude = coords.latitude;
      companyData.longitude = coords.longitude;
    }
  });
  
  return companiesToProcess;
}

class ICNDataService {
  private static instance: ICNDataService;
  private companies: Company[] = [];
  private icnItems: ICNItem[] = [];
  private isLoading = false;
  private isLoaded = false;
  private lastLoadTime: Date | null = null;
  private useSampling: boolean = true;
  
  private constructor() {}
  
  static getInstance(): ICNDataService {
    if (!ICNDataService.instance) {
      ICNDataService.instance = new ICNDataService();
    }
    return ICNDataService.instance;
  }
  
  setSampling(enabled: boolean): void {
    this.useSampling = enabled;
    if (this.isLoaded) {
      this.clearCache();
    }
  }
  
  async loadData(): Promise<void> {
    if (this.isLoaded) {
      console.log('ICN data already loaded');
      return;
    }
    
    if (this.isLoading) {
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
    
    this.isLoading = true;
    
    try {
      console.log(`Loading ICN data (sampling: ${this.useSampling})...`);
      
      const data = ICNData as ICNItem[];
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid ICN data format: expected array');
      }
      
      console.log(`Loaded ${data.length} ICN items`);
      
      this.icnItems = data.filter(item => 
        item.Organizations && 
        item.Organizations.length > 0 &&
        !isInvalidValue(item["Item ID"])
      );
      
      console.log(`Valid ICN items: ${this.icnItems.length}`);
      
      this.companies = await convertICNDataToCompanies(this.icnItems, this.useSampling);
      
      this.isLoaded = true;
      this.lastLoadTime = new Date();
      
      console.log(`Loaded ${this.companies.length} companies with geocoded locations`);
      this.logStatistics();
      
    } catch (error) {
      console.error('Error loading ICN data:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }
  
  getCompanies(): Company[] {
    return this.companies;
  }
  
  getICNItems(): ICNItem[] {
    return this.icnItems;
  }
  
  searchCompanies(searchText: string): Company[] {
    const searchLower = searchText.toLowerCase().trim();
    
    if (!searchLower) return this.companies;
    
    return this.companies.filter(company => 
      company.name.toLowerCase().includes(searchLower) ||
      company.address.toLowerCase().includes(searchLower) ||
      company.keySectors.some(sector => sector.toLowerCase().includes(searchLower)) ||
      company.capabilities?.some(cap => cap.toLowerCase().includes(searchLower)) ||
      company.billingAddress?.city.toLowerCase().includes(searchLower) ||
      company.billingAddress?.state.toLowerCase().includes(searchLower) ||
      company.billingAddress?.postcode.includes(searchLower)
    );
  }
  
  filterByState(state: string): Company[] {
    return this.companies.filter(company => 
      company.billingAddress?.state === state
    );
  }
  
  /**
   * Filter companies by company type (FIXED VERSION)
   */
  filterByCompanyType(type: 'supplier' | 'manufacturer' | 'both'): Company[] {
    return this.companies.filter(company => {
      const capabilityTypes = company.icnCapabilities?.map(cap => cap.capabilityType) || [];
      
      if (type === 'both') {
        const hasSupplier = capabilityTypes.some((capType: CapabilityType) => 
          CAPABILITY_TYPE_GROUPS.supplier.includes(capType)
        );
        const hasManufacturer = capabilityTypes.some((capType: CapabilityType) => 
          CAPABILITY_TYPE_GROUPS.manufacturer.includes(capType)
        );
        return hasSupplier && hasManufacturer;
      } else if (type === 'supplier') {
        return capabilityTypes.some((capType: CapabilityType) => 
          CAPABILITY_TYPE_GROUPS.supplier.includes(capType)
        );
      } else if (type === 'manufacturer') {
        return capabilityTypes.some((capType: CapabilityType) => 
          CAPABILITY_TYPE_GROUPS.manufacturer.includes(capType)
        );
      }
      
      return false;
    });
  }
  
  /**
   * Filter by specific capability types
   */
  filterByCapabilityTypes(types: string[]): Company[] {
    if (!types || types.length === 0) return this.companies;
    
    return this.companies.filter(company => {
      const companyCapTypes = company.icnCapabilities?.map(cap => cap.capabilityType) || [];
      
      // Check for special "Both" type
      if (types.includes('Both')) {
        const hasSupplier = companyCapTypes.some((capType: CapabilityType) => 
          CAPABILITY_TYPE_GROUPS.supplier.includes(capType)
        );
        const hasManufacturer = companyCapTypes.some((capType: CapabilityType) => 
          CAPABILITY_TYPE_GROUPS.manufacturer.includes(capType)
        );
        if (hasSupplier && hasManufacturer) return true;
      }
      
      // Check for grouped types
      if (types.some(t => CAPABILITY_TYPE_GROUPS.supplier.some(st => st === t))) {
        if (companyCapTypes.some((capType: CapabilityType) => 
          CAPABILITY_TYPE_GROUPS.supplier.includes(capType))) {
          return true;
        }
      }
      
      if (types.some(t => CAPABILITY_TYPE_GROUPS.manufacturer.some(mt => mt === t))) {
        if (companyCapTypes.some((capType: CapabilityType) => 
          CAPABILITY_TYPE_GROUPS.manufacturer.includes(capType))) {
          return true;
        }
      }
      
      if (types.some(t => CAPABILITY_TYPE_GROUPS.service.some(st => st === t))) {
        if (companyCapTypes.some((capType: CapabilityType) => 
          CAPABILITY_TYPE_GROUPS.service.includes(capType))) {
          return true;
        }
      }
      
      if (types.some(t => CAPABILITY_TYPE_GROUPS.retail.some(rt => rt === t))) {
        if (companyCapTypes.some((capType: CapabilityType) => 
          CAPABILITY_TYPE_GROUPS.retail.includes(capType))) {
          return true;
        }
      }
      
      // Direct capability type match
      return companyCapTypes.some(capType => types.includes(capType));
    });
  }
  
  filterBySector(sector: string): Company[] {
    return this.companies.filter(company =>
      company.keySectors.includes(sector)
    );
  }
  
  getCompanyById(id: string): Company | undefined {
    return this.companies.find(company => company.id === id);
  }
  
  getCompaniesByIds(ids: string[]): Company[] {
    return this.companies.filter(company => ids.includes(company.id));
  }
  
  getFilterOptions() {
    const sectors = new Set<string>();
    const states = new Set<string>();
    const cities = new Set<string>();
    const capabilities = new Set<string>();
    const capabilityTypes = new Set<string>();
    
    this.companies.forEach(company => {
      company.keySectors.forEach(sector => {
        if (sector !== 'General') {
          sectors.add(sector);
        }
      });
      
      if (company.billingAddress?.state && STANDARD_STATES_TERRITORIES.includes(company.billingAddress.state)) {
        states.add(company.billingAddress.state);
      }
      
      if (company.billingAddress?.city && 
          company.billingAddress.city !== 'City Not Available' &&
          !isInvalidValue(company.billingAddress.city)) {
        cities.add(company.billingAddress.city);
      }
      
      company.capabilities?.forEach(cap => {
        if (cap !== 'Service' && !isInvalidValue(cap)) {
          capabilities.add(cap);
        }
      });
      
      company.icnCapabilities?.forEach(icnCap => {
        if (icnCap.capabilityType) {
          capabilityTypes.add(icnCap.capabilityType);
        }
      });
    });
    
    const orderedStates = [
      ...AUSTRALIAN_STATES.filter(state => states.has(state)),
      ...NEW_ZEALAND_TERRITORIES.filter(state => states.has(state))
    ];
    
    return {
      sectors: Array.from(sectors).sort(),
      states: orderedStates,
      cities: Array.from(cities).sort(),
      capabilities: Array.from(capabilities).sort().slice(0, 100),
      capabilityTypes: Array.from(capabilityTypes).sort()
    };
  }
  
  getTerritoryStatistics() {
    const territoryCounts: Record<string, number> = {};
    
    this.companies.forEach(company => {
      const territory = company.billingAddress?.state;
      if (territory && STANDARD_STATES_TERRITORIES.includes(territory)) {
        territoryCounts[territory] = (territoryCounts[territory] || 0) + 1;
      }
    });
    
    return {
      australian: {
        VIC: territoryCounts.VIC || 0,
        NSW: territoryCounts.NSW || 0, 
        QLD: territoryCounts.QLD || 0,
        SA: territoryCounts.SA || 0,
        WA: territoryCounts.WA || 0,
        NT: territoryCounts.NT || 0,
        TAS: territoryCounts.TAS || 0,
        ACT: territoryCounts.ACT || 0,
        total: AUSTRALIAN_STATES.reduce((sum: number, state: string) => sum + (territoryCounts[state] || 0), 0)
      },
      newZealand: {
        NI: territoryCounts.NI || 0,
        SI: territoryCounts.SI || 0,
        total: NEW_ZEALAND_TERRITORIES.reduce((sum: number, state: string) => sum + (territoryCounts[state] || 0), 0)
      },
      total: Object.values(territoryCounts).reduce((sum, count) => sum + count, 0),
      byTerritory: territoryCounts
    };
  }
  
  getStatistics() {
    const stats = {
      totalCompanies: this.companies.length,
      totalItems: this.icnItems.length,
      verified: 0,
      unverified: 0,
      suppliers: 0,
      manufacturers: 0,
      both: 0,
      services: 0,
      retail: 0,
      byState: {} as Record<string, number>,
      bySector: {} as Record<string, number>,
      byCapabilityType: {} as Record<string, number>,
      avgCapabilitiesPerCompany: 0,
      topCities: [] as Array<{ city: string; count: number }>,
      dataQuality: {
        withEmail: 0,
        withPhone: 0,
        withWebsite: 0,
        withFullAddress: 0,
      }
    };
    
    let totalCapabilities = 0;
    const cityCount: Record<string, number> = {};
    
    this.companies.forEach(company => {
      if (company.verificationStatus === 'verified') {
        stats.verified++;
      } else {
        stats.unverified++;
      }
      
      const capabilityTypes = company.icnCapabilities?.map(cap => cap.capabilityType) || [];
      
      const hasSupplier = capabilityTypes.some((type: CapabilityType) => 
        CAPABILITY_TYPE_GROUPS.supplier.includes(type)
      );
      const hasManufacturer = capabilityTypes.some((type: CapabilityType) => 
        CAPABILITY_TYPE_GROUPS.manufacturer.includes(type)
      );
      const hasService = capabilityTypes.some((type: CapabilityType) => 
        CAPABILITY_TYPE_GROUPS.service.includes(type)
      );
      const hasRetail = capabilityTypes.some((type: CapabilityType) => 
        CAPABILITY_TYPE_GROUPS.retail.includes(type)
      );
      
      if (hasSupplier && hasManufacturer) {
        stats.both++;
      } else if (hasSupplier) {
        stats.suppliers++;
      } else if (hasManufacturer) {
        stats.manufacturers++;
      }
      
      if (hasService) stats.services++;
      if (hasRetail) stats.retail++;
      
      capabilityTypes.forEach(type => {
        stats.byCapabilityType[type] = (stats.byCapabilityType[type] || 0) + 1;
      });
      
      const state = company.billingAddress?.state;
      if (state && ALL_VALID_REGIONS.includes(state)) {
        stats.byState[state] = (stats.byState[state] || 0) + 1;
      }
      
      const city = company.billingAddress?.city;
      if (city && city !== 'City Not Available') {
        cityCount[city] = (cityCount[city] || 0) + 1;
      }
      
      company.keySectors.forEach(sector => {
        if (sector !== 'General') {
          stats.bySector[sector] = (stats.bySector[sector] || 0) + 1;
        }
      });
      
      if (company.icnCapabilities) {
        totalCapabilities += company.icnCapabilities.length;
      }
      
      if (company.email) stats.dataQuality.withEmail++;
      if (company.phoneNumber) stats.dataQuality.withPhone++;
      if (company.website) stats.dataQuality.withWebsite++;
      if (company.billingAddress?.street !== 'Address Not Available') {
        stats.dataQuality.withFullAddress++;
      }
    });
    
    stats.avgCapabilitiesPerCompany = stats.totalCompanies > 0 
      ? Number((totalCapabilities / stats.totalCompanies).toFixed(2))
      : 0;
    
    stats.topCities = Object.entries(cityCount)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return stats;
  }
  
  async forceRefreshGeocoding(): Promise<void> {
    if (!this.isLoaded) {
      console.log('Data not loaded, cannot refresh geocoding');
      return;
    }
    
    console.log('Force refreshing all geocoded coordinates...');
    
    const addresses = this.companies.map(company => ({
      orgId: company.id,
      street: company.billingAddress?.street || '',
      city: company.billingAddress?.city || '',
      state: company.billingAddress?.state || 'NSW',
      postcode: company.billingAddress?.postcode || ''
    }));
    
    const coordinates = await geocodeCacheService.batchGeocodeWithCache(
      addresses.map(a => ({
        street: a.street,
        city: a.city,
        state: a.state,
        postcode: a.postcode
      })),
      true
    );
    
    addresses.forEach((address, index) => {
      const company = this.companies.find(c => c.id === address.orgId);
      if (company) {
        company.latitude = coordinates[index].latitude;
        company.longitude = coordinates[index].longitude;
      }
    });
    
    console.log('Geocoding refresh complete');
  }
  
  getGeocodeCacheStats() {
    return geocodeCacheService.getCacheStats();
  }
  
  async clearGeocodeCache(): Promise<void> {
    await geocodeCacheService.clearCache();
    console.log('Geocode cache cleared');
  }
  
  async exportAllData(): Promise<{
    companies: Company[];
    geocodeCache: string | null;
    exportDate: string;
  }> {
    const geocodeCache = await geocodeCacheService.exportCache();
    
    return {
      companies: this.companies,
      geocodeCache,
      exportDate: new Date().toISOString()
    };
  }
  
  async importGeocodeCache(jsonData: string): Promise<boolean> {
    return await geocodeCacheService.importCache(jsonData);
  }
  
  private logStatistics() {
    const stats = this.getStatistics();
    const territoryStats = this.getTerritoryStatistics();
    
    console.group('ICN Data Statistics');
    console.table({
      'Total Companies': stats.totalCompanies,
      'Total Items': stats.totalItems,
      'Verified': stats.verified,
      'Unverified': stats.unverified,
      'Suppliers Only': stats.suppliers,
      'Manufacturers Only': stats.manufacturers,
      'Both Supplier & Manufacturer': stats.both,
      'Service Providers': stats.services,
      'Retail/Wholesale': stats.retail,
      'Avg Capabilities': stats.avgCapabilitiesPerCompany
    });
    console.log('Capability Type Distribution:', stats.byCapabilityType);
    console.log('Australian States:', territoryStats.australian);
    console.log('New Zealand Territories:', territoryStats.newZealand);
    console.log('Territory Distribution:', territoryStats.byTerritory);
    console.log('Top Cities:', stats.topCities.slice(0, 5));
    console.log('Sectors:', Object.keys(stats.bySector).length, 'unique sectors');
    console.log('Data Quality:', stats.dataQuality);
    console.groupEnd();
  }
  
  clearCache() {
    this.companies = [];
    this.icnItems = [];
    this.isLoaded = false;
    this.lastLoadTime = null;
  }
  
  isDataLoaded(): boolean {
    return this.isLoaded;
  }
  
  getLastLoadTime(): Date | null {
    return this.lastLoadTime;
  }
}

const icnDataService = ICNDataService.getInstance();
export default icnDataService;

export { 
  ICNDataService, 
  convertICNDataToCompanies, 
  convertICNDateToISO,
  normalizeStateTerritory,
  isInvalidValue,
  autoCorrectData,
  findClosestState,
  levenshteinDistance,
  stratifiedSampleCompanies,
  STANDARD_STATES_TERRITORIES,
  AUSTRALIAN_STATES,
  NEW_ZEALAND_TERRITORIES,
  DATA_CORRECTIONS,
  TYPO_CORRECTIONS,
  CAPABILITY_TYPES,
  CAPABILITY_TYPE_GROUPS
};
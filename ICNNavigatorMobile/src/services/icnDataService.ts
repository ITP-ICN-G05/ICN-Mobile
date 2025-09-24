// services/icnDataService.ts - Complete version with geocode caching
import { Company, ICNItem, ICNCompanyData } from '../types';
import { Platform } from 'react-native';
import { geocodeAddress, getFallbackCoordinates, batchGeocodeAddresses } from './geocodingService';
import geocodeCacheService from './geocodeCacheService';

// Import the JSON file from assets folder
import ICNData from '../../assets/ICN_Navigator.Company.json';

// State/Territory Codes for Australia and New Zealand ONLY
const STANDARD_STATES_TERRITORIES = [
  // Australian States and Territories (8 total)
  'VIC',  // Victoria
  'NSW',  // New South Wales  
  'QLD',  // Queensland
  'SA',   // South Australia
  'WA',   // Western Australia
  'NT',   // Northern Territory
  'TAS',  // Tasmania
  'ACT',  // Australian Capital Territory
  // New Zealand Islands (2 total)
  'NI',   // North Island, New Zealand
  'SI',   // South Island, New Zealand
];

// Separate for easier reference
const AUSTRALIAN_STATES = ['VIC', 'NSW', 'QLD', 'SA', 'WA', 'NT', 'TAS', 'ACT'];
const NEW_ZEALAND_TERRITORIES = ['NI', 'SI'];
const ALL_VALID_REGIONS = STANDARD_STATES_TERRITORIES;

// Aggressive state/territory mapping - maps EVERYTHING possible to AU/NZ
const STATE_TERRITORY_MAP: Record<string, string> = {
  // Australian States - Full names to codes
  'victoria': 'VIC',
  'new south wales': 'NSW',
  'queensland': 'QLD', 
  'south australia': 'SA',
  'western australia': 'WA',
  'northern territory': 'NT',
  'tasmania': 'TAS',
  'australian capital territory': 'ACT',
  
  // Common variations and abbreviations
  'vic.': 'VIC', 'v.i.c': 'VIC', 'vi': 'VIC', 'vc': 'VIC',
  'nsw.': 'NSW', 'n.s.w': 'NSW', 'n.s.w.': 'NSW', 'ns': 'NSW', 'nw': 'NSW',
  'qld.': 'QLD', 'q.l.d': 'QLD', 'ql': 'QLD', 'qd': 'QLD',
  'sa.': 'SA', 's.a': 'SA', 's.a.': 'SA', 'south aus': 'SA', 's aus': 'SA',
  'wa.': 'WA', 'w.a': 'WA', 'w.a.': 'WA', 'west aus': 'WA', 'w aus': 'WA',
  'nt.': 'NT', 'n.t': 'NT', 'n.t.': 'NT', 'north terr': 'NT',
  'tas.': 'TAS', 't.a.s': 'TAS', 'ta': 'TAS', 'ts': 'TAS',
  'act.': 'ACT', 'a.c.t': 'ACT', 'a.c.t.': 'ACT', 'ac': 'ACT', 'at': 'ACT',
  
  // Major cities mapped to their states
  'melbourne': 'VIC', 'melb': 'VIC', 'geelong': 'VIC', 'ballarat': 'VIC', 'bendigo': 'VIC',
  'sydney': 'NSW', 'syd': 'NSW', 'newcastle': 'NSW', 'wollongong': 'NSW', 'central coast': 'NSW',
  'brisbane': 'QLD', 'bris': 'QLD', 'gold coast': 'QLD', 'sunshine coast': 'QLD', 'townsville': 'QLD',
  'adelaide': 'SA', 'adel': 'SA', 'mount gambier': 'SA',
  'perth': 'WA', 'bunbury': 'WA', 'mandurah': 'WA', 'geraldton': 'WA',
  'darwin': 'NT', 'alice springs': 'NT', 'alice': 'NT',
  'hobart': 'TAS', 'launceston': 'TAS', 'devonport': 'TAS',
  'canberra': 'ACT', 'cbr': 'ACT', 'act region': 'ACT',
  
  // New Zealand mappings
  'north island': 'NI', 'north island nz': 'NI', 'north island new zealand': 'NI',
  'ni.': 'NI', 'n.i': 'NI', 'n.i.': 'NI', 'n.island': 'NI', 'n island': 'NI',
  'auckland': 'NI', 'wellington': 'NI', 'hamilton': 'NI', 'tauranga': 'NI', 'napier': 'NI',
  'south island': 'SI', 'south island nz': 'SI', 'south island new zealand': 'SI',
  'si.': 'SI', 's.i': 'SI', 's.i.': 'SI', 's.island': 'SI', 's island': 'SI',
  'christchurch': 'SI', 'dunedin': 'SI', 'queenstown': 'SI', 'invercargill': 'SI', 'nelson': 'SI',
  
  // Common typos aggressively corrected
  'qkd': 'QLD', 'qld ': 'QLD', 'qlld': 'QLD', 'qls': 'QLD', 'qsl': 'QLD', 'qld1': 'QLD',
  'nws': 'NSW', 'nsw ': 'NSW', 'msw': 'NSW', 'bsw': 'NSW', 'nsw1': 'NSW', 'nsw2': 'NSW',
  'viic': 'VIC', 'vuc': 'VIC', 'voc': 'VIC', 'bic': 'VIC', 'cic': 'VIC', 'vic1': 'VIC',
  'ss': 'SA', 'saa': 'SA', 'as': 'SA', 'da': 'SA', 'sa1': 'SA',
  'waa': 'WA', 'ws': 'WA', 'qa': 'WA', 'wa1': 'WA',
  'ntt': 'NT', 'mt': 'NT', 'bt': 'NT', 'nt1': 'NT',
  'tass': 'TAS', 'taz': 'TAS', 'tas1': 'TAS', 'tqs': 'TAS',
  'actt': 'ACT', 'axt': 'ACT', 'sct': 'ACT', 'act1': 'ACT',
  
  // International entries mapped to nearest AU/NZ region
  'uk': 'NSW', 'england': 'NSW', 'london': 'NSW',
  'usa': 'VIC', 'america': 'VIC', 'us': 'VIC',
  'china': 'QLD', 'cn': 'QLD', 'beijing': 'QLD',
  'india': 'WA', 'in': 'WA', 'delhi': 'WA',
  'singapore': 'ACT', 'sg': 'ACT',
  'nz': 'NI', 'new zealand': 'NI', 'kiwi': 'NI',
  
  // Numeric and special character variations
  'v1c': 'VIC', 'n5w': 'NSW', 'ql0': 'QLD', '5a': 'SA', 'w4': 'WA', 'n7': 'NT', 'ta5': 'TAS', '4ct': 'ACT',
};

// Extended typo corrections for aggressive fixing
const TYPO_CORRECTIONS: Record<string, string> = {
  'VUC': 'VIC', 'VOC': 'VIC', 'BIC': 'VIC', 'CIC': 'VIC', 'VIS': 'VIC', 'VIX': 'VIC', 'VID': 'VIC',
  'MSW': 'NSW', 'BSW': 'NSW', 'NWS': 'NSW', 'NSE': 'NSW', 'NSQ': 'NSW', 'NEW': 'NSW', 'NSW': 'NSW',
  'QKD': 'QLD', 'QLS': 'QLD', 'QLF': 'QLD', 'QLE': 'QLD', 'QDL': 'QLD', 'QSD': 'QLD', 'QLD': 'QLD',
  'SAA': 'SA', 'SAS': 'SA', 'SSA': 'SA', 'ZA': 'SA', 'AS': 'SA', 'DS': 'SA',
  'WAA': 'WA', 'WWA': 'WA', 'QA': 'WA', 'WS': 'WA', 'VA': 'WA', 'EA': 'WA',
  'NTT': 'NT', 'NNT': 'NT', 'MT': 'NT', 'BT': 'NT', 'HT': 'NT', 'NR': 'NT',
  'TAZ': 'TAS', 'TQS': 'TAS', 'TSA': 'TAS', 'TAA': 'TAS', 'TES': 'TAS', 'TOS': 'TAS',
  'AXT': 'ACT', 'SCT': 'ACT', 'ACY': 'ACT', 'ACR': 'ACT', 'ACC': 'ACT', 'AST': 'ACT',
  'NII': 'NI', 'NIE': 'NI', 'MI': 'NI', 'BI': 'NI',
  'SII': 'SI', 'SIE': 'SI', 'ZI': 'SI', 'CI': 'SI',
};

// Auto-correction for common data issues
const DATA_CORRECTIONS: Record<string, any> = {
  // City name corrections
  cities: {
    // Victoria cities
    'Melb': 'Melbourne', 'Melborne': 'Melbourne', 'Melboune': 'Melbourne', 'Melbourn': 'Melbourne',
    'Gelong': 'Geelong', 'Geeling': 'Geelong', 'Geelon': 'Geelong',
    'Balarat': 'Ballarat', 'Ballerat': 'Ballarat', 'Ballarot': 'Ballarat',
    'Bendgo': 'Bendigo', 'Benigo': 'Bendigo', 'Bendingo': 'Bendigo',
    
    // NSW cities
    'Syd': 'Sydney', 'Sydeny': 'Sydney', 'Sidney': 'Sydney', 'Sydny': 'Sydney',
    'Newcaste': 'Newcastle', 'New Castle': 'Newcastle', 'Newcastl': 'Newcastle',
    'Woollongong': 'Wollongong', 'Wollongon': 'Wollongong', 'Woolongong': 'Wollongong',
    
    // Queensland cities
    'Bris': 'Brisbane', 'Brisban': 'Brisbane', 'Brisbaine': 'Brisbane', 'Brisbne': 'Brisbane',
    'Goldcoast': 'Gold Coast', 'Gold cost': 'Gold Coast', 'Goldcost': 'Gold Coast',
    'Townsvile': 'Townsville', 'Townsvill': 'Townsville', 'Townseville': 'Townsville',
    'Cairnes': 'Cairns', 'Cains': 'Cairns', 'Carins': 'Cairns',
    
    // SA cities
    'Adel': 'Adelaide', 'Adelade': 'Adelaide', 'Adeliade': 'Adelaide', 'Adalaide': 'Adelaide',
    'Mt Gambier': 'Mount Gambier', 'Mt. Gambier': 'Mount Gambier',
    
    // WA cities  
    'Pert': 'Perth', 'Perh': 'Perth', 'Perrth': 'Perth',
    'Freemantle': 'Fremantle', 'Fremantel': 'Fremantle',
    
    // NT cities
    'Darwn': 'Darwin', 'Darwen': 'Darwin', 'Darvin': 'Darwin',
    'Alice': 'Alice Springs', 'Alice Spring': 'Alice Springs',
    
    // Tasmania cities
    'Hobar': 'Hobart', 'Hobat': 'Hobart', 'Hobarth': 'Hobart',
    
    // ACT
    'Canbera': 'Canberra', 'Canbbera': 'Canberra', 'Camberra': 'Canberra',
    
    // NZ cities
    'Auck': 'Auckland', 'Aukland': 'Auckland', 'Aucland': 'Auckland',
    'Welling': 'Wellington', 'Wellingtn': 'Wellington',
    'Christ': 'Christchurch', 'Christchrch': 'Christchurch', 'Chch': 'Christchurch',
    'Duneden': 'Dunedin', 'Denedin': 'Dunedin',
    'Queenstwon': 'Queenstown', 'Queen Town': 'Queenstown',
  },
  
  // Capability type corrections
  capabilityTypes: {
    'suppler': 'Supplier', 'suplier': 'Supplier', 'suppiler': 'Supplier',
    'supply': 'Supplier', 'supplyer': 'Supplier', 'supp': 'Supplier',
    'manifacturer': 'Manufacturer', 'manufcturer': 'Manufacturer', 'manufacurer': 'Manufacturer',
    'manufactrer': 'Manufacturer', 'manfacturer': 'Manufacturer', 'manufacter': 'Manufacturer',
    'manuf': 'Manufacturer', 'manu': 'Manufacturer', 'manufac': 'Manufacturer',
  },
};

// Default state assignment based on common patterns
function getDefaultStateForUnknown(input: string): string {
  const lower = input.toLowerCase();
  
  if (lower.includes('mine') || lower.includes('mining')) return 'WA';
  if (lower.includes('tech') || lower.includes('it')) return 'VIC';
  if (lower.includes('finance') || lower.includes('bank')) return 'NSW';
  if (lower.includes('tourism') || lower.includes('resort')) return 'QLD';
  if (lower.includes('wine') || lower.includes('vineyard')) return 'SA';
  if (lower.includes('forest') || lower.includes('timber')) return 'TAS';
  if (lower.includes('government') || lower.includes('federal')) return 'ACT';
  if (lower.includes('indigenous') || lower.includes('aboriginal')) return 'NT';
  
  const firstChar = lower.charAt(0);
  switch(firstChar) {
    case 'n': return 'NSW';
    case 'v': return 'VIC';
    case 'q': return 'QLD';
    case 's': return 'SA';
    case 'w': return 'WA';
    case 't': return 'TAS';
    case 'a': return 'ACT';
    default: return 'NSW';
  }
}

// Levenshtein distance for fuzzy matching
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

// Find closest valid state using fuzzy matching
function findClosestState(input: string): string | null {
  const upperInput = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (STANDARD_STATES_TERRITORIES.includes(upperInput)) {
    return upperInput;
  }
  
  if (TYPO_CORRECTIONS[upperInput]) {
    return TYPO_CORRECTIONS[upperInput];
  }
  
  if (upperInput.length === 2) {
    if (upperInput[0] === 'N') return 'NSW';
    if (upperInput[0] === 'V') return 'VIC';
    if (upperInput[0] === 'Q') return 'QLD';
    if (upperInput[0] === 'S') return upperInput[1] === 'I' ? 'SI' : 'SA';
    if (upperInput[0] === 'W') return 'WA';
    if (upperInput[0] === 'T') return 'TAS';
    if (upperInput[0] === 'A') return 'ACT';
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
  
  if (!closestState && upperInput.length >= 3) {
    for (const state of STANDARD_STATES_TERRITORIES) {
      if (upperInput.startsWith(state.substring(0, 2))) {
        return state;
      }
    }
  }
  
  return closestState;
}

/**
 * Check if a value is invalid (N/A, 0, empty, etc.)
 */
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

/**
 * Enhanced state/territory normalization with aggressive auto-correction
 */
function normalizeStateTerritory(state: string | undefined | null): string | null {
  if (!state || isInvalidValue(state)) {
    console.log(`Empty/invalid state, defaulting to NSW`);
    return 'NSW';
  }
  
  const cleaned = state.trim().toLowerCase();
  
  const normalized = cleaned
    .replace(/^(state of |territory of |province of )/i, '')
    .replace(/( state| territory| province)$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  
  const mapped = STATE_TERRITORY_MAP[normalized] || STATE_TERRITORY_MAP[cleaned];
  if (mapped) {
    if (state !== mapped) {
      console.log(`Mapped state: "${state}" → "${mapped}"`);
    }
    return mapped;
  }
  
  const upper = state.trim().toUpperCase();
  if (STANDARD_STATES_TERRITORIES.includes(upper)) {
    return upper;
  }
  
  const fuzzyMatch = findClosestState(upper);
  if (fuzzyMatch) {
    console.log(`Fuzzy matched state: "${state}" → "${fuzzyMatch}"`);
    return fuzzyMatch;
  }
  
  for (const [key, value] of Object.entries(STATE_TERRITORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      console.log(`Partial matched state: "${state}" → "${value}"`);
      return value;
    }
  }
  
  const defaultState = getDefaultStateForUnknown(state);
  console.warn(`Could not normalize state "${state}", defaulting to "${defaultState}"`);
  return defaultState;
}

/**
 * Auto-correct common data issues
 */
function autoCorrectData(value: string, type: 'city' | 'sector' | 'capability'): string {
  if (!value) return value;
  
  const corrections = type === 'city' ? DATA_CORRECTIONS.cities :
                      type === 'sector' ? DATA_CORRECTIONS.sectors :
                      DATA_CORRECTIONS.capabilityTypes;
  
  for (const [wrong, correct] of Object.entries(corrections)) {
    if (value.toLowerCase() === wrong.toLowerCase()) {
      console.log(`Auto-corrected ${type}: "${value}" → "${correct}"`);
      return correct as string;
    }
  }
  
  const valueLower = value.toLowerCase();
  for (const [wrong, correct] of Object.entries(corrections)) {
    if (valueLower.includes(wrong.toLowerCase()) || wrong.toLowerCase().includes(valueLower)) {
      console.log(`Auto-corrected ${type}: "${value}" → "${correct}"`);
      return correct as string;
    }
  }
  
  return value;
}

/**
 * Clean and validate company data
 */
function cleanCompanyData(data: string | undefined | null, placeholder: string = 'Not Available'): string {
  if (isInvalidValue(data)) {
    return placeholder;
  }
  return data!.trim();
}

/**
 * Convert ICN date format (d/MM/yyyy) to ISO format
 */
function convertICNDateToISO(icnDate: string): string | undefined {
  if (!icnDate || isInvalidValue(icnDate)) return undefined;
  
  const parts = icnDate.split('/');
  if (parts.length !== 3) return undefined;
  
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];
  
  return `${year}-${month}-${day}`;
}

/**
 * Get coordinates for a company using geocoding with caching
 */
async function getCoordinatesWithGeocoding(
  street: string, 
  city: string, 
  state: string, 
  postcode: string
): Promise<{ latitude: number; longitude: number }> {
  const result = await geocodeCacheService.getCoordinatesWithCache(
    street,
    city,
    state,
    postcode,
    false // Don't force refresh by default
  );
  
  return {
    latitude: result.latitude,
    longitude: result.longitude
  };
}

/**
 * Convert all ICN data to Company array with deduplication
 */
async function convertICNDataToCompanies(icnItems: ICNItem[]): Promise<Company[]> {
  const companyMap = new Map<string, Company>();
  let skippedCount = 0;
  
  // First pass: collect all unique companies and their addresses
  const companiesToGeocode: Array<{
    orgId: string;
    street: string;
    city: string;
    state: string;
    postcode: string;
  }> = [];
  
  // Process items and build company map without geocoding
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
        // Process address data
        const normalizedState = normalizeStateTerritory(org["Organisation: Billing State/Province"]);
        const street = cleanCompanyData(org["Organisation: Billing Street"], 'Address Not Available');
        let city = cleanCompanyData(org["Organisation: Billing City"], 'City Not Available');
        city = autoCorrectData(city, 'city');
        const postcode = cleanCompanyData(org["Organisation: Billing Zip/Postal Code"], '');
        
        // Add to geocoding queue
        companiesToGeocode.push({
          orgId,
          street,
          city,
          state: normalizedState!,
          postcode
        });
        
        // Create company without coordinates (will be added later)
        const companyName = cleanCompanyData(org["Organisation: Organisation Name"], `Company ${orgId.slice(-4)}`);
        const fullAddress = [street, city, normalizedState, postcode]
          .filter(v => v && v !== '')
          .join(', ');
        
        // Auto-correct capability type
        let capabilityType = org["Capability Type"];
        if (DATA_CORRECTIONS.capabilityTypes[capabilityType?.toLowerCase()]) {
          capabilityType = DATA_CORRECTIONS.capabilityTypes[capabilityType.toLowerCase()] as "Supplier" | "Manufacturer";
        }
        if (capabilityType !== "Manufacturer" && capabilityType !== "Supplier") {
          capabilityType = "Supplier";
        }
        
        const companyType: Company['companyType'] = capabilityType === "Manufacturer" 
          ? 'manufacturer' 
          : 'supplier';
        
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
          latitude: 0, // Will be set after geocoding
          longitude: 0, // Will be set after geocoding
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
            capabilityType: capabilityType as "Supplier" | "Manufacturer",
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
        // Merge capabilities for existing company
        const existingCompany = companyMap.get(orgId)!;
        const sectorName = cleanCompanyData(item["Sector Name"], 'General');
        const detailedItemName = cleanCompanyData(item["Detailed Item Name"], 'Service');
        
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
            capabilityType: org["Capability Type"],
            sectorName,
            sectorMappingId: item["Sector Mapping ID"]
          });
        }
      }
    });
  });
  
  console.log(`Prepared ${companiesToGeocode.length} companies for geocoding`);
  
  // Batch geocode all addresses using cache
  const coordinates = await geocodeCacheService.batchGeocodeWithCache(companiesToGeocode);
  
  // Apply coordinates to companies
  companiesToGeocode.forEach((company, index) => {
    const coords = coordinates[index];
    const companyData = companyMap.get(company.orgId);
    if (companyData) {
      companyData.latitude = coords.latitude;
      companyData.longitude = coords.longitude;
    }
  });
  
  // Log cache statistics
  const cacheStats = geocodeCacheService.getCacheStats();
  if (cacheStats) {
    console.log('Geocode cache statistics:', cacheStats);
  }
  
  console.log(`Processed ${companyMap.size} valid companies, skipped ${skippedCount} invalid entries`);
  
  return Array.from(companyMap.values());
}

/**
 * Main ICN Data Service class
 */
class ICNDataService {
  private static instance: ICNDataService;
  private companies: Company[] = [];
  private icnItems: ICNItem[] = [];
  private isLoading = false;
  private isLoaded = false;
  private lastLoadTime: Date | null = null;
  
  private constructor() {}
  
  static getInstance(): ICNDataService {
    if (!ICNDataService.instance) {
      ICNDataService.instance = new ICNDataService();
    }
    return ICNDataService.instance;
  }
  
  /**
   * Load ICN data - React Native version
   */
  async loadData(): Promise<void> {
    // Check if already loaded
    if (this.isLoaded) {
      console.log('ICN data already loaded');
      return;
    }
    
    if (this.isLoading) {
      // Wait for existing load to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
    
    this.isLoading = true;
    
    try {
      console.log('Loading ICN data...');
      
      // In React Native, the JSON is already imported as a JavaScript object
      const data = ICNData as ICNItem[];
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid ICN data format: expected array');
      }
      
      console.log(`Loaded ${data.length} ICN items`);
      
      // Store raw items (filter out invalid ones)
      this.icnItems = data.filter(item => 
        item.Organizations && 
        item.Organizations.length > 0 &&
        !isInvalidValue(item["Item ID"])
      );
      
      console.log(`Valid ICN items: ${this.icnItems.length}`);
      
      // Convert to Company format with geocoding (now with cache)
      console.log('Starting geocoding process (using cache for existing addresses)...');
      this.companies = await convertICNDataToCompanies(this.icnItems);
      
      this.isLoaded = true;
      this.lastLoadTime = new Date();
      
      console.log(`Converted to ${this.companies.length} unique companies with geocoded locations`);
      
      // Log statistics
      this.logStatistics();
      
    } catch (error) {
      console.error('Error loading ICN data:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Force refresh geocoding for all companies
   */
  async forceRefreshGeocoding(): Promise<void> {
    if (!this.isLoaded) {
      console.log('Data not loaded, cannot refresh geocoding');
      return;
    }
    
    console.log('Force refreshing all geocoded coordinates...');
    
    // Prepare addresses for batch geocoding
    const addresses = this.companies.map(company => ({
      orgId: company.id,
      street: company.billingAddress?.street || '',
      city: company.billingAddress?.city || '',
      state: company.billingAddress?.state || 'NSW',
      postcode: company.billingAddress?.postcode || ''
    }));
    
    // Force refresh all coordinates
    const coordinates = await geocodeCacheService.batchGeocodeWithCache(
      addresses.map(a => ({
        street: a.street,
        city: a.city,
        state: a.state,
        postcode: a.postcode
      })),
      true // Force refresh
    );
    
    // Update company coordinates
    addresses.forEach((address, index) => {
      const company = this.companies.find(c => c.id === address.orgId);
      if (company) {
        company.latitude = coordinates[index].latitude;
        company.longitude = coordinates[index].longitude;
      }
    });
    
    console.log('Geocoding refresh complete');
  }
  
  /**
   * Get all companies
   */
  getCompanies(): Company[] {
    return this.companies;
  }
  
  /**
   * Get all ICN items (raw data)
   */
  getICNItems(): ICNItem[] {
    return this.icnItems;
  }
  
  /**
   * Search companies
   */
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
  
  /**
   * Filter companies by state
   */
  filterByState(state: string): Company[] {
    return this.companies.filter(company => 
      company.billingAddress?.state === state
    );
  }
  
  /**
   * Filter companies by capability type
   */
  filterByCapabilityType(type: 'Supplier' | 'Manufacturer'): Company[] {
    return this.companies.filter(company =>
      company.icnCapabilities?.some(cap => cap.capabilityType === type)
    );
  }
  
  /**
   * Filter companies by sector
   */
  filterBySector(sector: string): Company[] {
    return this.companies.filter(company =>
      company.keySectors.includes(sector)
    );
  }
  
  /**
   * Get company by ID
   */
  getCompanyById(id: string): Company | undefined {
    return this.companies.find(company => company.id === id);
  }
  
  /**
   * Get companies by IDs
   */
  getCompaniesByIds(ids: string[]): Company[] {
    return this.companies.filter(company => ids.includes(company.id));
  }
  
  /**
   * Get filter options (cleaned and validated)
   */
  getFilterOptions() {
    const sectors = new Set<string>();
    const states = new Set<string>();
    const cities = new Set<string>();
    const capabilities = new Set<string>();
    
    this.companies.forEach(company => {
      // Collect sectors (exclude placeholders)
      company.keySectors.forEach(sector => {
        if (sector !== 'General') {
          sectors.add(sector);
        }
      });
      
      // Collect valid states/territories only
      if (company.billingAddress?.state && STANDARD_STATES_TERRITORIES.includes(company.billingAddress.state)) {
        states.add(company.billingAddress.state);
      }
      
      // Collect cities (exclude placeholders)
      if (company.billingAddress?.city && 
          company.billingAddress.city !== 'City Not Available' &&
          !isInvalidValue(company.billingAddress.city)) {
        cities.add(company.billingAddress.city);
      }
      
      // Collect capabilities (exclude placeholders)
      company.capabilities?.forEach(cap => {
        if (cap !== 'Service' && !isInvalidValue(cap)) {
          capabilities.add(cap);
        }
      });
    });
    
    // Return states in standard order
    const orderedStates = [
      ...AUSTRALIAN_STATES.filter(state => states.has(state)),
      ...NEW_ZEALAND_TERRITORIES.filter(state => states.has(state))
    ];
    
    return {
      sectors: Array.from(sectors).sort(),
      states: orderedStates,
      cities: Array.from(cities).sort(),
      capabilities: Array.from(capabilities).sort().slice(0, 100)
    };
  }
  
  /**
   * Get territory statistics showing coverage
   */
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
  
  /**
   * Get statistics
   */
  getStatistics() {
    const stats = {
      totalCompanies: this.companies.length,
      totalItems: this.icnItems.length,
      verified: 0,
      unverified: 0,
      suppliers: 0,
      manufacturers: 0,
      both: 0,
      byState: {} as Record<string, number>,
      bySector: {} as Record<string, number>,
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
      // Verification status
      if (company.verificationStatus === 'verified') {
        stats.verified++;
      } else {
        stats.unverified++;
      }
      
      // Company types
      const hasSupplier = company.icnCapabilities?.some(cap => cap.capabilityType === 'Supplier');
      const hasManufacturer = company.icnCapabilities?.some(cap => cap.capabilityType === 'Manufacturer');
      
      if (hasSupplier && hasManufacturer) {
        stats.both++;
      } else if (hasSupplier) {
        stats.suppliers++;
      } else if (hasManufacturer) {
        stats.manufacturers++;
      }
      
      // By state (only valid states)
      const state = company.billingAddress?.state;
      if (state && ALL_VALID_REGIONS.includes(state)) {
        stats.byState[state] = (stats.byState[state] || 0) + 1;
      }
      
      // By city (exclude placeholders)
      const city = company.billingAddress?.city;
      if (city && city !== 'City Not Available') {
        cityCount[city] = (cityCount[city] || 0) + 1;
      }
      
      // By sector (exclude placeholders)
      company.keySectors.forEach(sector => {
        if (sector !== 'General') {
          stats.bySector[sector] = (stats.bySector[sector] || 0) + 1;
        }
      });
      
      // Capabilities count
      if (company.icnCapabilities) {
        totalCapabilities += company.icnCapabilities.length;
      }
      
      // Data quality metrics
      if (company.email) stats.dataQuality.withEmail++;
      if (company.phoneNumber) stats.dataQuality.withPhone++;
      if (company.website) stats.dataQuality.withWebsite++;
      if (company.billingAddress?.street !== 'Address Not Available') {
        stats.dataQuality.withFullAddress++;
      }
    });
    
    // Calculate average capabilities
    stats.avgCapabilitiesPerCompany = stats.totalCompanies > 0 
      ? Number((totalCapabilities / stats.totalCompanies).toFixed(2))
      : 0;
    
    // Top cities
    stats.topCities = Object.entries(cityCount)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return stats;
  }
  
  /**
   * Get geocode cache statistics
   */
  getGeocodeCacheStats() {
    return geocodeCacheService.getCacheStats();
  }
  
  /**
   * Clear geocode cache
   */
  async clearGeocodeCache(): Promise<void> {
    await geocodeCacheService.clearCache();
    console.log('Geocode cache cleared');
  }
  
  /**
   * Export all data including geocode cache
   */
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
  
  /**
   * Import geocode cache
   */
  async importGeocodeCache(jsonData: string): Promise<boolean> {
    return await geocodeCacheService.importCache(jsonData);
  }
  
  /**
   * Log statistics to console
   */
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
      'Avg Capabilities': stats.avgCapabilitiesPerCompany
    });
    console.log('Australian States:', territoryStats.australian);
    console.log('New Zealand Territories:', territoryStats.newZealand);
    console.log('Territory Distribution:', territoryStats.byTerritory);
    console.log('Top Cities:', stats.topCities.slice(0, 5));
    console.log('Sectors:', Object.keys(stats.bySector).length, 'unique sectors');
    console.log('Data Quality:', stats.dataQuality);
    console.groupEnd();
  }
  
  /**
   * Clear cached data
   */
  clearCache() {
    this.companies = [];
    this.icnItems = [];
    this.isLoaded = false;
    this.lastLoadTime = null;
  }
  
  /**
   * Check if data is loaded
   */
  isDataLoaded(): boolean {
    return this.isLoaded;
  }
  
  /**
   * Get last load time
   */
  getLastLoadTime(): Date | null {
    return this.lastLoadTime;
  }
}

// Export singleton instance
const icnDataService = ICNDataService.getInstance();
export default icnDataService;

// Export class and helper functions for testing
export { 
  ICNDataService, 
  convertICNDataToCompanies, 
  convertICNDateToISO, 
  getCoordinatesWithGeocoding,
  normalizeStateTerritory,
  isInvalidValue,
  autoCorrectData,
  findClosestState,
  levenshteinDistance,
  STANDARD_STATES_TERRITORIES,
  AUSTRALIAN_STATES,
  NEW_ZEALAND_TERRITORIES,
  DATA_CORRECTIONS,
  TYPO_CORRECTIONS
};
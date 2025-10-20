import { Company } from '../../../../types';

// State normalization mapping
export const STATE_ALIASES: Record<string, string> = {
  VIC: 'VIC', Victoria: 'VIC',
  NSW: 'NSW', 'New South Wales': 'NSW',
  QLD: 'QLD', Queensland: 'QLD',
  SA: 'SA', 'South Australia': 'SA',
  WA: 'WA', 'Western Australia': 'WA',
  TAS: 'TAS', Tasmania: 'TAS',
  ACT: 'ACT', 'Australian Capital Territory': 'ACT',
  NT: 'NT', 'Northern Territory': 'NT',
  NI: 'NI', 'North Island': 'NI',
  SI: 'SI', 'South Island': 'SI'
};

// Helper function to normalize state codes
export const normaliseState = (s?: string): string | undefined => {
  if (!s || s.trim() === '' || s.trim() === '#N/A') return undefined;
  const trimmed = s.trim();
  return STATE_ALIASES[trimmed] ?? trimmed.toUpperCase();
};

// Helper function to extract company sectors from multiple sources
export const extractCompanySectors = (c: Company): string[] => {
  const list1 = Array.isArray((c as any).keySectors) ? (c as any).keySectors : [];
  const list2 = c.icnCapabilities?.map(x => (x as any).sector ?? (x as any).sectorName)?.filter(Boolean) ?? [];
  return Array.from(new Set([...list1, ...list2])).map(s => String(s).toLowerCase());
};

// Check if filters are active
export const hasActiveFilters = (filters: any): boolean => {
  return filters.capabilities.length > 0 || 
         (filters.sectors && filters.sectors.length > 0) ||
         (filters.state && filters.state !== 'All') ||
         (filters.companyTypes && filters.companyTypes.length > 0) ||
         filters.distance !== 'All' ||
         (filters.companySize && filters.companySize !== 'All') ||
         (filters.certifications && filters.certifications.length > 0) ||
         (filters.ownershipType && filters.ownershipType.length > 0) ||
         filters.socialEnterprise ||
         filters.australianDisability ||
         (filters.revenue && (filters.revenue.min > 0 || filters.revenue.max < 10000000)) ||
         (filters.employeeCount && (filters.employeeCount.min > 0 || filters.employeeCount.max < 1000)) ||
         (filters.localContentPercentage && filters.localContentPercentage > 0);
};

// Get active filter count
export const getActiveFilterCount = (filters: any): number => {
  let count = 0;
  if (filters.capabilities.length > 0) count++;
  if (filters.sectors && filters.sectors.length > 0) count++;
  if (filters.state && filters.state !== 'All') count++;
  if (filters.companyTypes && filters.companyTypes.length > 0) count++;
  if (filters.distance !== 'All') count++;
  if (filters.companySize && filters.companySize !== 'All') count++;
  if (filters.certifications && filters.certifications.length > 0) count++;
  if (filters.ownershipType && filters.ownershipType.length > 0) count++;
  if (filters.socialEnterprise) count++;
  if (filters.australianDisability) count++;
  if (filters.revenue && (filters.revenue.min > 0 || filters.revenue.max < 10000000)) count++;
  if (filters.employeeCount && (filters.employeeCount.min > 0 || filters.employeeCount.max < 1000)) count++;
  if (filters.localContentPercentage && filters.localContentPercentage > 0) count++;
  return count;
};

// Get filter badges for display
export const getFilterBadges = (filters: any): string[] => {
  const badges = [];
  
  if (filters.capabilities.length > 0) {
    badges.push(`${filters.capabilities.length} capabilities`);
  }
  if (filters.sectors && filters.sectors.length > 0) {
    badges.push(`${filters.sectors.length} sectors`);
  }
  if (filters.state && filters.state !== 'All') {
    badges.push(filters.state);
  }
  if (filters.companyTypes && filters.companyTypes.length > 0) {
    badges.push(`${filters.companyTypes.length} types`);
  }
  if (filters.companySize && filters.companySize !== 'All') {
    badges.push(filters.companySize);
  }
  if (filters.certifications && filters.certifications.length > 0) {
    badges.push('Certified');
  }
  if (filters.ownershipType && filters.ownershipType.length > 0) {
    badges.push('Diverse owned');
  }
  if (filters.socialEnterprise) {
    badges.push('Social enterprise');
  }
  if (filters.australianDisability) {
    badges.push('ADE');
  }
  if (filters.revenue) {
    const minM = (filters.revenue.min / 1000000).toFixed(1);
    const maxM = (filters.revenue.max / 1000000).toFixed(1);
    badges.push(`Revenue: $${minM}M-$${maxM}M`);
  }
  if (filters.employeeCount) {
    badges.push(`Employees: ${filters.employeeCount.min}-${filters.employeeCount.max}`);
  }
  if (filters.localContentPercentage && filters.localContentPercentage > 0) {
    badges.push(`Local content ≥${filters.localContentPercentage}%`);
  }
  
  return badges;
};

// Normalize filters to handle "All" values properly
export const normaliseFilters = (f: any): any => ({
  ...f,
  sectors: f.sectors?.filter((s: string) => s !== 'All') ?? [],
  state: !f.state || f.state === 'All' ? undefined : f.state,
  companySize: !f.companySize || f.companySize === 'All' ? undefined : f.companySize,
});
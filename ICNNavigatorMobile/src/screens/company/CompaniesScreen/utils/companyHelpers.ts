import { Company } from '../../../../types';

// Format city and state, filtering out #N/A values
export const formatCityState = (company: Company): string => {
  const city = company.billingAddress?.city;
  const state = company.billingAddress?.state;
  const cleanValue = (s?: string) => 
    s && s !== '#N/A' && s.trim() !== '' ? s : null;
  const parts = [cleanValue(city), cleanValue(state)].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Location unavailable';
};

// Get display name for company
export const getDisplayName = (company: Company): string => {
  return company.name === 'Organisation Name' ? `Company ${company.id.slice(-4)}` : company.name;
};

// Get avatar text for company
export const getAvatarText = (company: Company): string => {
  const displayName = getDisplayName(company);
  return displayName.charAt(0).toUpperCase();
};
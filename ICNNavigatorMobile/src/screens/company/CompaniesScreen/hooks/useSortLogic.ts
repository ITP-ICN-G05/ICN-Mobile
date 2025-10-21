import { useMemo } from 'react';
import { Company } from '../../../../types';
import { getDisplayName } from '../utils/companyHelpers';

export const useSortLogic = (companies: Company[], sortBy: 'name' | 'verified' | 'recent') => {
  const sortedCompanies = useMemo(() => {
    const filtered = [...companies];
    
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => {
          const nameA = getDisplayName(a);
          const nameB = getDisplayName(b);
          return nameA.localeCompare(nameB);
        });
        break;
      case 'verified':
        filtered.sort((a, b) => {
          if (a.verificationStatus === 'verified' && b.verificationStatus !== 'verified') return -1;
          if (a.verificationStatus !== 'verified' && b.verificationStatus === 'verified') return 1;
          return getDisplayName(a).localeCompare(getDisplayName(b));
        });
        break;
      case 'recent':
        // Sort by last updated or ID
        filtered.sort((a, b) => {
          if (a.lastUpdated && b.lastUpdated) {
            return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
          }
          return b.id.localeCompare(a.id);
        });
        break;
    }

    return filtered;
  }, [companies, sortBy]);

  return sortedCompanies;
};
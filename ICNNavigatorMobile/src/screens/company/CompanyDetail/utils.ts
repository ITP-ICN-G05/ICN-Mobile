// Data validation utility
export const isValidData = (value: any): boolean => {
  if (!value) return false;
  const stringValue = String(value).trim();
  return (
    stringValue !== '' &&
    stringValue !== '#N/A' &&
    stringValue !== '0' &&
    stringValue !== 'null' &&
    stringValue !== 'undefined' &&
    stringValue !== 'N/A' &&
    stringValue.toLowerCase() !== 'na'
  );
};

// Get display value with placeholder
export const getDisplayValue = (
  value: string | number | undefined, 
  placeholder: string
): string => {
  if (isValidData(value)) {
    return String(value);
  }
  return placeholder;
};

// Format ABN number
export const formatABN = (abn: string): string => {
  if (!abn) return '12345678901';
  const cleanABN = abn.replace(/\s/g, '');
  return `${cleanABN.slice(0, 2)} ${cleanABN.slice(2)}`;
};

// Group capabilities by itemName
export const groupCapabilities = (capabilities: any[]): any[] => {
  if (!capabilities) return [];
  
  const groups = new Map<string, any[]>();
  
  capabilities.forEach(cap => {
    const key = cap.itemName;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(cap);
  });
  
  return Array.from(groups.entries()).map(([itemName, items]) => ({
    itemName,
    items,
    isGroup: items.length > 1,
    count: items.length
  }));
};
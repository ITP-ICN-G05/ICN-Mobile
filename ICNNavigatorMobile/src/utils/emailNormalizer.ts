/**
 * Email normalization utility
 * Handles email address normalization to prevent inconsistencies across the app
 */

/**
 * Normalize email address to prevent inconsistencies
 * - NFKC normalization: handles full-width characters and invisible characters
 * - Trim: removes leading/trailing whitespace
 * - Lowercase: ensures case-insensitive comparison
 */
export const normalizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  return email
    .normalize('NFKC')  // Handle full-width/invisible characters
    .trim()
    .toLowerCase();
};

/**
 * Debug email normalization issues
 * Prints character codes for debugging
 */
export const debugEmail = (email: string, label: string = 'Email'): void => {
  console.log(`${label}:`, email);
  console.log(`${label} char codes:`, email.split('').map(c => c.charCodeAt(0)));
  console.log(`${label} normalized:`, normalizeEmail(email));
};

/**
 * Validate email format (basic validation)
 */
export const isValidEmail = (email: string): boolean => {
  const normalized = normalizeEmail(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalized);
};


import * as Crypto from 'expo-crypto';

/**
 * Password hashing utility class
 * Uses SHA-256 algorithm for one-way password hashing
 */
export class PasswordHasher {
  /**
   * Hash password using SHA-256 algorithm
   * @param password Original password
   * @returns Promise<string> 64-character hexadecimal hash value
   */
  static async hash(password: string): Promise<string> {
    if (!password || password.trim() === '') {
      throw new Error('Password cannot be empty');
    }
    
    try {
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      return hashedPassword;
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Validate password format (for frontend validation)
   * @param password Original password
   * @returns boolean Whether password meets requirements
   */
  static validatePassword(password: string): boolean {
    // Password length 6-20 characters, containing letters, numbers, underscores
    const passwordPattern = /^[a-zA-Z0-9_]{6,20}$/;
    return passwordPattern.test(password);
  }

  /**
   * Validate hashed password format (for validating hash results)
   * @param hashedPassword Hashed password
   * @returns boolean Whether it's a valid SHA-256 hash value
   */
  static validateHashedPassword(hashedPassword: string): boolean {
    // SHA-256 hash should be 64 hexadecimal characters
    const hashPattern = /^[a-fA-F0-9]{64}$/;
    return hashPattern.test(hashedPassword);
  }
}

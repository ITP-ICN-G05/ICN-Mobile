import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the frontend-only profile fields that don't exist in backend
export interface ExtendedProfileFields {
  bio?: string;
  linkedIn?: string;
  website?: string;
  memberSince?: string;
  // Add any additional frontend-only fields here
}

// Keys for AsyncStorage
const EXTENDED_PROFILE_KEY = '@extended_profile';

/**
 * LocalProfileStore handles storage and retrieval of profile fields
 * that exist in the frontend but not in the backend
 */
export class LocalProfileStore {
  /**
   * Saves extended profile fields to AsyncStorage
   * @param userId User ID to associate with the extended fields
   * @param data Extended profile fields to save
   */
  static async saveExtendedFields(userId: string, data: ExtendedProfileFields): Promise<void> {
    try {
      // Get existing extended profiles
      const storedData = await this.getAllExtendedProfiles();
      
      // Update or add the profile for this user
      const updatedData = {
        ...storedData,
        [userId]: {
          ...storedData[userId],
          ...data,
          lastUpdated: new Date().toISOString(),
        }
      };
      
      await AsyncStorage.setItem(EXTENDED_PROFILE_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving extended profile fields:', error);
      throw error;
    }
  }
  
  /**
   * Retrieves extended profile fields for a user
   * @param userId User ID to retrieve extended fields for
   */
  static async getExtendedFields(userId: string): Promise<ExtendedProfileFields | null> {
    try {
      const storedData = await this.getAllExtendedProfiles();
      return storedData[userId] || null;
    } catch (error) {
      console.error('Error retrieving extended profile fields:', error);
      return null;
    }
  }
  
  /**
   * Retrieves all extended profiles from AsyncStorage
   */
  private static async getAllExtendedProfiles(): Promise<Record<string, ExtendedProfileFields>> {
    try {
      const jsonData = await AsyncStorage.getItem(EXTENDED_PROFILE_KEY);
      return jsonData ? JSON.parse(jsonData) : {};
    } catch (error) {
      console.error('Error retrieving all extended profiles:', error);
      return {};
    }
  }
  
  /**
   * Deletes extended profile for a user
   * @param userId User ID to delete extended profile for
   */
  static async deleteExtendedFields(userId: string): Promise<void> {
    try {
      const storedData = await this.getAllExtendedProfiles();
      if (storedData[userId]) {
        delete storedData[userId];
        await AsyncStorage.setItem(EXTENDED_PROFILE_KEY, JSON.stringify(storedData));
      }
    } catch (error) {
      console.error('Error deleting extended profile:', error);
      throw error;
    }
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clear all AsyncStorage data
 * This utility can be imported and called anywhere in the app
 */
export const clearAllStorage = async () => {
  try {
    console.log('🧹 Clearing all AsyncStorage data...');
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing AsyncStorage:', error);
    return false;
  }
};

/**
 * Clear specific keys from AsyncStorage
 */
export const clearSpecificKeys = async (keys: string[]) => {
  try {
    console.log('🧹 Clearing specific keys:', keys);
    await AsyncStorage.multiRemove(keys);
    console.log('✅ Keys cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing keys:', error);
    return false;
  }
};

/**
 * List all AsyncStorage keys
 */
export const listAllKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('📋 All AsyncStorage keys:', keys);
    return keys;
  } catch (error) {
    console.error('❌ Error listing keys:', error);
    return [];
  }
};

// If running directly from command line (for testing)
if (require.main === module) {
  clearAllStorage();
}

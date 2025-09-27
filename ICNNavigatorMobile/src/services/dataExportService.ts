import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

interface ExportData {
  userData: any;
  savedCompanies: any[];
  searchHistory: any[];
  preferences: any;
  exportDate: string;
}

class DataExportService {
  static async exportUserData(format: 'json' | 'csv' = 'json'): Promise<void> {
    try {
      const exportData = await this.gatherUserData();

      let fileContent: string;
      let fileName: string;
      let mimeType: string;

      if (format === 'json') {
        fileContent = JSON.stringify(exportData, null, 2);
        fileName = `icn_export_${Date.now()}.json`;
        mimeType = 'application/json';
      } else {
        fileContent = this.convertToCSV(exportData);
        fileName = `icn_export_${Date.now()}.csv`;
        mimeType = 'text/csv';
      }

      await this.saveAndShareFile(fileContent, fileName, mimeType);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  private static async gatherUserData(): Promise<ExportData> {
    const token = await AsyncStorage.getItem('@auth_token');
    
    // Mock implementation for testing - replace with actual API call
    let backendData = { user: {} };
    
    try {
      const response = await fetch('https://api.icnvictoria.com/user/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        backendData = await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch backend data, using local data only');
    }

    const localData = {
      savedCompanies: await AsyncStorage.getItem('@saved_companies'),
      searchHistory: await AsyncStorage.getItem('@recent_searches'),
      preferences: await AsyncStorage.getItem('@user_preferences'),
    };

    return {
      userData: backendData.user || {},
      savedCompanies: JSON.parse(localData.savedCompanies || '[]'),
      searchHistory: JSON.parse(localData.searchHistory || '[]'),
      preferences: JSON.parse(localData.preferences || '{}'),
      exportDate: new Date().toISOString(),
    };
  }

  private static convertToCSV(data: ExportData): string {
    const csvRows = ['Category,Field,Value'];
    
    // User data
    if (data.userData) {
      Object.entries(data.userData).forEach(([key, value]) => {
        csvRows.push(`User,${key},"${value}"`);
      });
    }

    // Saved companies
    if (data.savedCompanies && data.savedCompanies.length > 0) {
      data.savedCompanies.forEach((company: any, index: number) => {
        csvRows.push(`SavedCompany_${index + 1},Name,"${company.name || ''}"`);
        csvRows.push(`SavedCompany_${index + 1},Location,"${company.location || ''}"`);
      });
    }

    // Search history
    if (data.searchHistory && data.searchHistory.length > 0) {
      data.searchHistory.forEach((search: any, index: number) => {
        csvRows.push(`SearchHistory_${index + 1},Query,"${search.query || ''}"`);
        csvRows.push(`SearchHistory_${index + 1},Date,"${search.date || ''}"`);
      });
    }

    return csvRows.join('\n');
  }

  private static async saveAndShareFile(
    content: string, 
    fileName: string, 
    mimeType: string
  ): Promise<void> {
    try {
      // Using legacy API which is still supported
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: 'Export Your ICN Navigator Data',
          UTI: mimeType,
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error in saveAndShareFile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to save and share file: ${errorMessage}`);
    }
  }

  static async updateExportCount(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (!token) {
        console.warn('No auth token found, skipping export count update');
        return;
      }

      await fetch('https://api.icnvictoria.com/user/export-count', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Failed to update export count:', error);
    }
  }
}

export default DataExportService;
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCE_KEYS = {
  LAST_DISTRICT: '@kadro_pref_district_v1',
};

/**
 * Stores only lightweight local UI preferences.
 * Domain entities live in Supabase PostgreSQL.
 */
export const storageService = {
  async getPreferredDistrict(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PREFERENCE_KEYS.LAST_DISTRICT);
    } catch {
      return null;
    }
  },

  async setPreferredDistrict(district: string): Promise<void> {
    try {
      await AsyncStorage.setItem(PREFERENCE_KEYS.LAST_DISTRICT, district);
    } catch {
      // Ignore non-critical local preference failure
    }
  },

  async clearPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PREFERENCE_KEYS.LAST_DISTRICT);
    } catch {
      // Ignore cleanup failure
    }
  },
};

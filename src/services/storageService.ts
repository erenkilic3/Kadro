import AsyncStorage from '@react-native-async-storage/async-storage';
import { Match, GearItem, User } from '../types';
import { INITIAL_MATCHES, INITIAL_GEAR_ITEMS, INITIAL_USER } from '../constants/mockData';

const KEYS = {
  MATCHES: '@kadro_matches_v1',
  GEAR: '@kadro_gear_v1',
  USER: '@kadro_user_v1',
  FAVORITES: '@kadro_favorites_v1',
};

export const storageService = {
  async getMatches(): Promise<Match[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MATCHES);
      if (!data) {
        // Seed initial matches on first run
        await AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(INITIAL_MATCHES));
        return INITIAL_MATCHES;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error fetching matches from storage', e);
      return INITIAL_MATCHES;
    }
  },

  async saveMatches(matches: Match[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
    } catch (e) {
      console.error('Error saving matches', e);
    }
  },

  async getGearItems(): Promise<GearItem[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.GEAR);
      if (!data) {
        await AsyncStorage.setItem(KEYS.GEAR, JSON.stringify(INITIAL_GEAR_ITEMS));
        return INITIAL_GEAR_ITEMS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error fetching gear items from storage', e);
      return INITIAL_GEAR_ITEMS;
    }
  },

  async saveGearItems(items: GearItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.GEAR, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving gear items', e);
    }
  },

  async getUser(): Promise<User> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER);
      if (!data) {
        await AsyncStorage.setItem(KEYS.USER, JSON.stringify(INITIAL_USER));
        return INITIAL_USER;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error fetching user from storage', e);
      return INITIAL_USER;
    }
  },

  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user', e);
    }
  },

  async resetToDemoData(): Promise<{ matches: Match[]; gear: GearItem[]; user: User }> {
    try {
      await AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(INITIAL_MATCHES));
      await AsyncStorage.setItem(KEYS.GEAR, JSON.stringify(INITIAL_GEAR_ITEMS));
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(INITIAL_USER));
      return {
        matches: INITIAL_MATCHES,
        gear: INITIAL_GEAR_ITEMS,
        user: INITIAL_USER,
      };
    } catch (e) {
      console.error('Error resetting demo data', e);
      return {
        matches: INITIAL_MATCHES,
        gear: INITIAL_GEAR_ITEMS,
        user: INITIAL_USER,
      };
    }
  },
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Match,
  GearItem,
  User,
  RegionalLeague,
  PlayerEvaluation,
  JoinRequest,
} from '../types';
import {
  INITIAL_MATCHES,
  INITIAL_GEAR_ITEMS,
  INITIAL_USER,
  INITIAL_LEAGUES,
  INITIAL_EVALUATIONS,
  INITIAL_JOIN_REQUESTS,
} from '../constants/mockData';

const KEYS = {
  MATCHES: '@kadro_matches_v1',
  GEAR: '@kadro_gear_v1',
  USER: '@kadro_user_v1',
  LEAGUES: '@kadro_leagues_v1',
  EVALUATIONS: '@kadro_evaluations_v1',
  JOIN_REQUESTS: '@kadro_join_requests_v1',
  FAVORITES: '@kadro_favorites_v1',
};

export const storageService = {
  async getMatches(): Promise<Match[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MATCHES);
      if (!data) {
        await AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(INITIAL_MATCHES));
        return INITIAL_MATCHES;
      }
      const parsed: Match[] = JSON.parse(data);
      const joinReqsSeeded = await AsyncStorage.getItem(KEYS.JOIN_REQUESTS);
      if (!joinReqsSeeded) {
        const captainMatch = INITIAL_MATCHES.find((m) => m.id === 'match_4');
        if (captainMatch && !parsed.some((m) => m.id === 'match_4')) {
          const merged = [captainMatch, ...parsed];
          await AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(merged));
          return merged;
        }
      }
      return parsed;
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

  async getLeagues(): Promise<RegionalLeague[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.LEAGUES);
      if (!data) {
        await AsyncStorage.setItem(KEYS.LEAGUES, JSON.stringify(INITIAL_LEAGUES));
        return INITIAL_LEAGUES;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error fetching leagues from storage', e);
      return INITIAL_LEAGUES;
    }
  },

  async saveLeagues(leagues: RegionalLeague[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LEAGUES, JSON.stringify(leagues));
    } catch (e) {
      console.error('Error saving leagues', e);
    }
  },

  async getEvaluations(): Promise<PlayerEvaluation[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.EVALUATIONS);
      if (!data) {
        await AsyncStorage.setItem(KEYS.EVALUATIONS, JSON.stringify(INITIAL_EVALUATIONS));
        return INITIAL_EVALUATIONS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error fetching evaluations from storage', e);
      return INITIAL_EVALUATIONS;
    }
  },

  async saveEvaluations(evaluations: PlayerEvaluation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.EVALUATIONS, JSON.stringify(evaluations));
    } catch (e) {
      console.error('Error saving evaluations', e);
    }
  },

  async getJoinRequests(): Promise<JoinRequest[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.JOIN_REQUESTS);
      if (!data) {
        await AsyncStorage.setItem(KEYS.JOIN_REQUESTS, JSON.stringify(INITIAL_JOIN_REQUESTS));
        return INITIAL_JOIN_REQUESTS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error fetching join requests from storage', e);
      return INITIAL_JOIN_REQUESTS;
    }
  },

  async saveJoinRequests(requests: JoinRequest[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.JOIN_REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.error('Error saving join requests', e);
    }
  },

  async resetToDemoData(): Promise<{
    matches: Match[];
    gear: GearItem[];
    user: User;
    leagues: RegionalLeague[];
    evaluations: PlayerEvaluation[];
    joinRequests: JoinRequest[];
  }> {
    try {
      await AsyncStorage.setItem(KEYS.MATCHES, JSON.stringify(INITIAL_MATCHES));
      await AsyncStorage.setItem(KEYS.GEAR, JSON.stringify(INITIAL_GEAR_ITEMS));
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(INITIAL_USER));
      await AsyncStorage.setItem(KEYS.LEAGUES, JSON.stringify(INITIAL_LEAGUES));
      await AsyncStorage.setItem(KEYS.EVALUATIONS, JSON.stringify(INITIAL_EVALUATIONS));
      await AsyncStorage.setItem(KEYS.JOIN_REQUESTS, JSON.stringify(INITIAL_JOIN_REQUESTS));
      return {
        matches: INITIAL_MATCHES,
        gear: INITIAL_GEAR_ITEMS,
        user: INITIAL_USER,
        leagues: INITIAL_LEAGUES,
        evaluations: INITIAL_EVALUATIONS,
        joinRequests: INITIAL_JOIN_REQUESTS,
      };
    } catch (e) {
      console.error('Error resetting demo data', e);
      return {
        matches: INITIAL_MATCHES,
        gear: INITIAL_GEAR_ITEMS,
        user: INITIAL_USER,
        leagues: INITIAL_LEAGUES,
        evaluations: INITIAL_EVALUATIONS,
        joinRequests: INITIAL_JOIN_REQUESTS,
      };
    }
  },
};

import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import {
  Match,
  GearItem,
  User,
  PlayerPosition,
  MatchFormat,
  GearCategory,
  GearCondition,
  RosterSlot,
  PredictionChoice,
  RegionalLeague,
  CreateLeagueInput,
  LeagueTeam,
  PlayerEvaluation,
  SubmitEvaluationInput,
  JoinRequest,
} from '../types';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

function recalculateMissingPositions(
  roster: RosterSlot[],
  totalSlots: number
): PlayerPosition[] {
  const remainingMissing: PlayerPosition[] = [];
  const halfCount = totalSlots / 2;
  for (let i = 0; i < halfCount; i++) {
    const slot = roster[i];
    if (slot && !slot.isFilled) {
      remainingMissing.push(slot.position);
    }
  }
  return remainingMissing;
}

interface CreateMatchInput {
  title: string;
  venueName: string;
  address: string;
  district: string;
  date: string;
  time: string;
  format: MatchFormat;
  pitchType: 'Açık Saha' | 'Kapalı Saha';
  feePerPlayer: number;
  missingPositions: PlayerPosition[];
  notes?: string;
}

interface CreateGearInput {
  title: string;
  description: string;
  category: GearCategory;
  brand: string;
  size: string;
  price: number;
  condition: GearCondition;
  location: string;
}

interface AppContextType {
  matches: Match[];
  gearItems: GearItem[];
  leagues: RegionalLeague[];
  evaluations: PlayerEvaluation[];
  joinRequests: JoinRequest[];
  currentUser: User;
  isLoading: boolean;
  isSupabaseActive: boolean;
  createMatch: (data: CreateMatchInput) => Promise<void>;
  joinMatchSlot: (matchId: string, slotId: string) => Promise<boolean>;
  leaveMatch: (matchId: string) => Promise<boolean>;
  sendJoinRequest: (matchId: string, slotId: string, message?: string) => Promise<boolean>;
  cancelJoinRequest: (requestId: string) => Promise<boolean>;
  approveJoinRequest: (requestId: string) => Promise<boolean>;
  rejectJoinRequest: (requestId: string) => Promise<boolean>;
  getMatchJoinRequests: (matchId: string) => JoinRequest[];
  getUserMatchJoinRequest: (matchId: string) => JoinRequest | undefined;
  votePrediction: (matchId: string, choice: PredictionChoice) => Promise<boolean>;
  createGearItem: (data: CreateGearInput) => Promise<void>;
  markGearSold: (gearId: string) => Promise<void>;
  createLeague: (data: CreateLeagueInput) => Promise<RegionalLeague>;
  joinLeague: (leagueId: string, teamName: string, captainName: string, captainPhone?: string) => Promise<boolean>;
  submitPlayerEvaluation: (input: SubmitEvaluationInput) => Promise<boolean>;
  hasUserEvaluatedPlayer: (matchId: string, targetPlayerId: string) => boolean;
  getPlayerEvaluations: (playerId: string) => PlayerEvaluation[];
  updateUser: (updates: Partial<User>) => Promise<void>;
  resetDemoData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [leagues, setLeagues] = useState<RegionalLeague[]>([]);
  const [evaluations, setEvaluations] = useState<PlayerEvaluation[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({} as User);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(false);
  const { authUser, isAuthenticated, isAuthLoading, isDemoSession } = useAuth();

  const fetchAllData = useCallback(async () => {
    if (isSupabaseConfigured && authUser && !isDemoSession) {
      try {
        const storedUser = await supabaseService.getUser({
          id: authUser.id,
          email: authUser.email,
          user_metadata: authUser.user_metadata,
        });
        const [storedMatches, storedGear, storedLeagues, storedEvals, storedJoinReqs] =
          await Promise.all([
            supabaseService.getMatches(storedUser.id),
            supabaseService.getGearItems(),
            supabaseService.getLeagues(),
            supabaseService.getEvaluations(),
            supabaseService.getJoinRequests(),
          ]);
        return {
          storedMatches,
          storedGear,
          storedUser,
          storedLeagues,
          storedEvals,
          storedJoinReqs,
          supabaseReady: true,
        };
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local AsyncStorage:', err);
      }
    }

    const [storedMatches, storedGear, storedUser, storedLeagues, storedEvals, storedJoinReqs] =
      await Promise.all([
        storageService.getMatches(),
        storageService.getGearItems(),
        storageService.getUser(),
        storageService.getLeagues(),
        storageService.getEvaluations(),
        storageService.getJoinRequests(),
      ]);

    return {
      storedMatches,
      storedGear,
      storedUser,
      storedLeagues,
      storedEvals,
      storedJoinReqs,
      supabaseReady: false,
    };
  }, [authUser, isDemoSession]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllData();
      setMatches(data.storedMatches);
      setGearItems(data.storedGear);
      setCurrentUser(data.storedUser);
      setLeagues(data.storedLeagues);
      setEvaluations(data.storedEvals);
      setJoinRequests(data.storedJoinReqs);
      setIsSupabaseActive(data.supabaseReady);
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;

    let isMounted = true;
    const initData = async () => {
      try {
        const data = await fetchAllData();
        if (!isMounted) return;
        setMatches(data.storedMatches);
        setGearItems(data.storedGear);
        setCurrentUser(data.storedUser);
        setLeagues(data.storedLeagues);
        setEvaluations(data.storedEvals);
        setJoinRequests(data.storedJoinReqs);
        setIsSupabaseActive(data.supabaseReady);
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    initData();
    return () => {
      isMounted = false;
    };
  }, [fetchAllData, isAuthLoading, isAuthenticated]);

  const createMatch = async (data: CreateMatchInput) => {
    const totalSlots = data.format === '5v5' ? 10 : data.format === '6v6' ? 12 : 14;
    
    // Generate tactical lineup roster
    const halfSlots = totalSlots / 2;
    const roster: RosterSlot[] = [];

    // Team 1 slots
    roster.push({
      id: `slot_1`,
      position: 'GK',
      isFilled: !data.missingPositions.includes('GK'),
      assignedPlayer: !data.missingPositions.includes('GK') ? { id: 'bot_gk1', name: 'Kaan (Kaleci)', rating: 4.8 } : undefined,
    });

    const defNeeded = data.missingPositions.filter((p) => p === 'DEF').length;
    let defAssigned = 0;
    for (let i = 2; i <= (halfSlots === 7 ? 4 : 3); i++) {
      const isMissing = defAssigned < defNeeded;
      if (isMissing) defAssigned++;
      roster.push({
        id: `slot_${i}`,
        position: 'DEF',
        isFilled: !isMissing,
        assignedPlayer: !isMissing ? { id: `bot_def_${i}`, name: `Oyuncu DEF ${i}`, rating: 4.6 } : undefined,
      });
    }

    const midNeeded = data.missingPositions.filter((p) => p === 'MID').length;
    let midAssigned = 0;
    for (let i = (halfSlots === 7 ? 5 : 4); i <= halfSlots - 1; i++) {
      const isMissing = midAssigned < midNeeded;
      if (isMissing) midAssigned++;
      roster.push({
        id: `slot_${i}`,
        position: 'MID',
        isFilled: !isMissing,
        assignedPlayer: !isMissing ? { id: `bot_mid_${i}`, name: `Oyuncu MID ${i}`, rating: 4.7 } : undefined,
      });
    }

    // FWD
    const fwdNeeded = data.missingPositions.includes('FWD');
    roster.push({
      id: `slot_${halfSlots}`,
      position: 'FWD',
      isFilled: !fwdNeeded,
      assignedPlayer: !fwdNeeded
        ? { id: currentUser.id, name: `${currentUser.name} (Kaptan)`, rating: currentUser.rating }
        : undefined,
      isOrganizer: !fwdNeeded,
    });

    // Team 2 (opponents - pre-filled)
    for (let i = halfSlots + 1; i <= totalSlots; i++) {
      const pos: PlayerPosition = i === halfSlots + 1 ? 'GK' : i <= halfSlots + 3 ? 'DEF' : i <= totalSlots - 1 ? 'MID' : 'FWD';
      roster.push({
        id: `slot_${i}`,
        position: pos,
        isFilled: true,
        assignedPlayer: { id: `opp_${i}`, name: `Rakip #${i - halfSlots}`, rating: 4.7 },
      });
    }

    const newMatch: Match = {
      id: `match_${Date.now()}`,
      title: data.title,
      organizerId: currentUser.id,
      organizerName: currentUser.name,
      organizerPhone: currentUser.phone,
      venueName: data.venueName,
      address: data.address,
      city: 'İstanbul',
      district: data.district,
      date: data.date,
      time: data.time,
      format: data.format,
      pitchType: data.pitchType,
      feePerPlayer: data.feePerPlayer,
      totalSlots,
      roster,
      missingPositions: data.missingPositions,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      prediction: {
        team1Name: `${currentUser.name?.split(' ')[0] || 'Kadro'} & Ekibi`,
        team2Name: 'Rakip Takım',
        votesTeam1: 1,
        votesDraw: 0,
        votesTeam2: 0,
        category: 'Normal',
        userVote: '1',
      },
    };

    const updated = [newMatch, ...matches];
    setMatches(updated);
    if (isSupabaseActive) {
      await supabaseService.createMatch(newMatch);
    }
    await storageService.saveMatches(updated);
  };

  const votePrediction = async (matchId: string, choice: PredictionChoice): Promise<boolean> => {
    let success = false;
    let isFirstTimeForMatch = false;
    let nextPrediction: Match['prediction'];

    const updated = matches.map((m) => {
      if (m.id !== matchId) return m;

      const pred = m.prediction || {
        team1Name: `${m.organizerName.split(' ')[0]} Kadrosu`,
        team2Name: 'Rakip Takım',
        votesTeam1: 5,
        votesDraw: 2,
        votesTeam2: 4,
        category: 'Normal' as const,
      };

      const oldVote = pred.userVote;
      if (oldVote === choice) return m;

      if (!oldVote) {
        isFirstTimeForMatch = true;
      }

      let v1 = pred.votesTeam1;
      let vx = pred.votesDraw;
      let v2 = pred.votesTeam2;

      if (oldVote === '1') v1 = Math.max(0, v1 - 1);
      else if (oldVote === 'X') vx = Math.max(0, vx - 1);
      else if (oldVote === '2') v2 = Math.max(0, v2 - 1);

      if (choice === '1') v1 += 1;
      else if (choice === 'X') vx += 1;
      else if (choice === '2') v2 += 1;

      success = true;
      nextPrediction = {
        ...pred,
        votesTeam1: v1,
        votesDraw: vx,
        votesTeam2: v2,
        userVote: choice,
      };
      return {
        ...m,
        prediction: nextPrediction,
      };
    });

    if (success) {
      setMatches(updated);
      if (isSupabaseActive && nextPrediction) {
        await supabaseService.updateMatchPrediction(matchId, nextPrediction);
      }
      await storageService.saveMatches(updated);

      if (isFirstTimeForMatch) {
        const newScore = (currentUser.predictionScore || 0) + 25;
        const newTotal = (currentUser.totalPredictions || 0) + 1;
        const updatedUser = {
          ...currentUser,
          predictionScore: newScore,
          totalPredictions: newTotal,
        };
        setCurrentUser(updatedUser);
        if (isSupabaseActive) {
          await supabaseService.saveUser(updatedUser);
        }
        await storageService.saveUser(updatedUser);
      }
    }
    return success;
  };

  const joinMatchSlot = async (matchId: string, slotId: string): Promise<boolean> => {
    let success = false;
    let nextRoster: RosterSlot[] = [];
    let nextMissing: PlayerPosition[] = [];

    const updated = matches.map((m) => {
      if (m.id !== matchId) return m;

      const updatedRoster = m.roster.map((slot) => {
        if (slot.id === slotId && !slot.isFilled) {
          success = true;
          return {
            ...slot,
            isFilled: true,
            assignedPlayer: {
              id: currentUser.id,
              name: currentUser.name,
              phone: currentUser.phone,
              rating: currentUser.rating,
            },
          };
        }
        return slot;
      });

      const remainingMissing = recalculateMissingPositions(updatedRoster, m.totalSlots);
      if (success) {
        nextRoster = updatedRoster;
        nextMissing = remainingMissing;
      }

      return {
        ...m,
        roster: updatedRoster,
        missingPositions: remainingMissing,
        isJoined: true,
      };
    });

    if (success) {
      setMatches(updated);
      if (isSupabaseActive) {
        await supabaseService.updateMatchRoster(matchId, nextRoster, nextMissing);
      }
      await storageService.saveMatches(updated);
    }
    return success;
  };

  const leaveMatch = async (matchId: string): Promise<boolean> => {
    let success = false;
    let nextRoster: RosterSlot[] = [];
    let nextMissing: PlayerPosition[] = [];

    const updated = matches.map((m) => {
      if (m.id !== matchId) return m;

      const updatedRoster = m.roster.map((slot) => {
        if (slot.assignedPlayer?.id === currentUser.id) {
          success = true;
          return {
            ...slot,
            isFilled: false,
            assignedPlayer: undefined,
          };
        }
        return slot;
      });

      const remainingMissing = recalculateMissingPositions(updatedRoster, m.totalSlots);
      if (success) {
        nextRoster = updatedRoster;
        nextMissing = remainingMissing;
      }

      return {
        ...m,
        roster: updatedRoster,
        missingPositions: remainingMissing,
        isJoined: false,
      };
    });

    if (success) {
      setMatches(updated);
      if (isSupabaseActive) {
        await supabaseService.updateMatchRoster(matchId, nextRoster, nextMissing);
      }
      await storageService.saveMatches(updated);

      const filteredRequests = joinRequests.filter(
        (r) => !(r.matchId === matchId && r.requesterId === currentUser.id && r.status === 'APPROVED')
      );
      if (filteredRequests.length !== joinRequests.length) {
        setJoinRequests(filteredRequests);
        await storageService.saveJoinRequests(filteredRequests);
      }
    }
    return success;
  };

  const sendJoinRequest = async (
    matchId: string,
    slotId: string,
    message?: string
  ): Promise<boolean> => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return false;

    const alreadyInRoster = targetMatch.roster.some(
      (s) => s.assignedPlayer?.id === currentUser.id
    );
    if (alreadyInRoster) return false;

    const hasPending = joinRequests.some(
      (r) =>
        r.matchId === matchId &&
        r.requesterId === currentUser.id &&
        r.status === 'PENDING'
    );
    if (hasPending) return false;

    const targetSlot = targetMatch.roster.find((s) => s.id === slotId && !s.isFilled);
    if (!targetSlot) return false;

    const newRequest: JoinRequest = {
      id: `jr_${Date.now()}`,
      matchId,
      slotId: targetSlot.id,
      position: targetSlot.position,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterPhone: currentUser.phone,
      requesterRating: currentUser.rating || 4.8,
      requesterFairPlay: currentUser.fairPlayRating || 4.9,
      message: message?.trim() || undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const updatedRequests = [
      newRequest,
      ...joinRequests.filter(
        (r) => !(r.matchId === matchId && r.requesterId === currentUser.id && r.status === 'REJECTED')
      ),
    ];
    setJoinRequests(updatedRequests);
    if (isSupabaseActive) {
      await supabaseService.createJoinRequest(newRequest);
    }
    await storageService.saveJoinRequests(updatedRequests);
    return true;
  };

  const cancelJoinRequest = async (requestId: string): Promise<boolean> => {
    const exists = joinRequests.some(
      (r) => r.id === requestId && r.requesterId === currentUser.id && r.status === 'PENDING'
    );
    if (!exists) return false;

    const updatedRequests = joinRequests.filter((r) => r.id !== requestId);
    setJoinRequests(updatedRequests);
    if (isSupabaseActive) {
      await supabaseService.cancelJoinRequest(requestId);
    }
    await storageService.saveJoinRequests(updatedRequests);
    return true;
  };

  const approveJoinRequest = async (requestId: string): Promise<boolean> => {
    const req = joinRequests.find((r) => r.id === requestId && r.status === 'PENDING');
    if (!req) return false;

    const targetMatch = matches.find((m) => m.id === req.matchId);
    if (!targetMatch) return false;

    const alreadyInRoster = targetMatch.roster.some(
      (s) => s.assignedPlayer?.id === req.requesterId
    );
    if (alreadyInRoster) return false;

    const team1Count = Math.ceil(targetMatch.totalSlots / 2);
    const team1Slots = targetMatch.roster.slice(0, team1Count);
    const chosenSlot =
      team1Slots.find((s) => s.id === req.slotId && !s.isFilled) ||
      team1Slots.find((s) => s.position === req.position && !s.isFilled);

    if (!chosenSlot) return false;

    if (isSupabaseActive) {
      const rpcOk = await supabaseService.approveJoinRequest(requestId);
      if (!rpcOk) return false;
    }

    const updatedMatches = matches.map((m) => {
      if (m.id !== req.matchId) return m;
      const updatedRoster = m.roster.map((slot) => {
        if (slot.id !== chosenSlot.id) return slot;
        return {
          ...slot,
          isFilled: true,
          assignedPlayer: {
            id: req.requesterId,
            name: req.requesterName,
            phone: req.requesterPhone,
            rating: req.requesterRating,
            fairPlayRating: req.requesterFairPlay,
          },
        };
      });

      return {
        ...m,
        roster: updatedRoster,
        missingPositions: recalculateMissingPositions(updatedRoster, m.totalSlots),
        isJoined: m.isJoined || req.requesterId === currentUser.id,
      };
    });

    const now = new Date().toISOString();
    const updatedRequests = joinRequests.map((r) =>
      r.id === requestId
        ? { ...r, slotId: chosenSlot.id, status: 'APPROVED' as const, respondedAt: now }
        : r
    );

    setMatches(updatedMatches);
    setJoinRequests(updatedRequests);
    await Promise.all([
      storageService.saveMatches(updatedMatches),
      storageService.saveJoinRequests(updatedRequests),
    ]);
    return true;
  };

  const rejectJoinRequest = async (requestId: string): Promise<boolean> => {
    const exists = joinRequests.some((r) => r.id === requestId && r.status === 'PENDING');
    if (!exists) return false;

    const now = new Date().toISOString();
    const updatedRequests = joinRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'REJECTED' as const, respondedAt: now } : r
    );
    setJoinRequests(updatedRequests);
    if (isSupabaseActive) {
      await supabaseService.rejectJoinRequest(requestId);
    }
    await storageService.saveJoinRequests(updatedRequests);
    return true;
  };

  const getMatchJoinRequests = (matchId: string): JoinRequest[] => {
    return joinRequests.filter((r) => r.matchId === matchId);
  };

  const getUserMatchJoinRequest = (matchId: string): JoinRequest | undefined => {
    return joinRequests.find(
      (r) => r.matchId === matchId && r.requesterId === currentUser.id
    );
  };

  const createGearItem = async (data: CreateGearInput) => {
    const newItem: GearItem = {
      id: `gear_${Date.now()}`,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      sellerPhone: currentUser.phone,
      title: data.title,
      description: data.description,
      category: data.category,
      brand: data.brand,
      size: data.size,
      price: data.price,
      condition: data.condition,
      location: data.location || `${currentUser.city} / ${currentUser.district}`,
      status: 'Available',
      createdAt: new Date().toISOString(),
      iconName: data.category === 'Boots' ? 'football' : data.category === 'Jerseys' ? 'shirt' : data.category === 'Gloves' ? 'hand-left' : 'shield',
    };

    const updated = [newItem, ...gearItems];
    setGearItems(updated);
    if (isSupabaseActive) {
      await supabaseService.createGearItem(newItem);
    }
    await storageService.saveGearItems(updated);
  };

  const markGearSold = async (gearId: string) => {
    const updated = gearItems.map((item) =>
      item.id === gearId ? { ...item, status: 'Sold' as const } : item
    );
    setGearItems(updated);
    if (isSupabaseActive) {
      await supabaseService.markGearSold(gearId);
    }
    await storageService.saveGearItems(updated);
  };

  const updateUser = async (updates: Partial<User>) => {
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    if (isSupabaseActive) {
      await supabaseService.saveUser(updated);
    }
    await storageService.saveUser(updated);
  };

  const createLeague = async (data: CreateLeagueInput): Promise<RegionalLeague> => {
    const emojis = ['⚡', '🦁', '🦅', '🔥', '🌟', '🛡️', '🎯', '🌊', '👑', '⚔️'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    const hostTeam: LeagueTeam = {
      id: `team_host_${Date.now()}`,
      name: `${(currentUser.name || 'Kadıköy').split(' ')[0]} Spor`,
      logoEmoji: randomEmoji,
      captainName: currentUser.name || 'Lig Kurucusu',
      captainPhone: currentUser.phone,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    };

    const newLeague: RegionalLeague = {
      id: `league_${Date.now()}`,
      title: data.title,
      season: data.season,
      city: data.city,
      district: data.district,
      venueName: data.venueName,
      format: data.format,
      status: 'REGISTRATION_OPEN',
      maxTeams: data.maxTeams,
      registeredTeamsCount: 1,
      entryFee: data.entryFee,
      prize: data.prize,
      organizerName: currentUser.name || 'Lig Koordinatörü',
      organizerPhone: currentUser.phone || '+90 532 100 20 30',
      description: data.description,
      rules:
        data.rules && data.rules.length > 0
          ? data.rules
          : [
              'Maçlar 25 x 2 = 50 dakika oynanır.',
              'TFF lisanslı resmi hakem atanır.',
              'Fair-Play ve centilmenlik esastır.',
              'Fikstür maçları haftalık olarak planlanır.',
            ],
      themeColor: data.themeColor || '#00D664',
      createdAt: new Date().toISOString(),
      teams: [hostTeam],
      fixtures: [],
    };

    const updated = [newLeague, ...leagues];
    setLeagues(updated);
    if (isSupabaseActive) {
      await supabaseService.createLeague(newLeague);
    }
    await storageService.saveLeagues(updated);
    return newLeague;
  };

  const joinLeague = async (
    leagueId: string,
    teamName: string,
    captainName: string,
    captainPhone?: string
  ): Promise<boolean> => {
    const leagueIndex = leagues.findIndex((l) => l.id === leagueId);
    if (leagueIndex === -1) return false;

    const targetLeague = leagues[leagueIndex];
    if (targetLeague.registeredTeamsCount >= targetLeague.maxTeams) {
      return false;
    }

    const emojis = ['⚡', '🦁', '🦅', '🔥', '🌟', '🛡️', '🎯', '🌊', '🐺', '⭐'];
    const newTeam: LeagueTeam = {
      id: `team_${Date.now()}`,
      name: teamName.trim(),
      logoEmoji: emojis[Math.floor(Math.random() * emojis.length)],
      captainName: captainName.trim(),
      captainPhone: captainPhone || currentUser.phone,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    };

    const newCount = targetLeague.registeredTeamsCount + 1;
    const isFull = newCount >= targetLeague.maxTeams;

    const updatedLeague: RegionalLeague = {
      ...targetLeague,
      registeredTeamsCount: newCount,
      status: isFull ? 'IN_PROGRESS' : targetLeague.status,
      teams: [...targetLeague.teams, newTeam],
    };

    const updatedLeagues = [...leagues];
    updatedLeagues[leagueIndex] = updatedLeague;
    setLeagues(updatedLeagues);
    if (isSupabaseActive) {
      await supabaseService.addTeamToLeague(
        leagueId,
        newTeam,
        newCount,
        updatedLeague.status
      );
    }
    await storageService.saveLeagues(updatedLeagues);
    return true;
  };

  const submitPlayerEvaluation = async (input: SubmitEvaluationInput): Promise<boolean> => {
    // Check if user already evaluated this player in this match
    const exists = evaluations.some(
      (e) =>
        e.matchId === input.matchId &&
        e.targetPlayerId === input.targetPlayerId &&
        e.evaluatorId === currentUser.id
    );
    if (exists) {
      return false;
    }

    const newEvaluation: PlayerEvaluation = {
      id: `eval_${Date.now()}`,
      matchId: input.matchId,
      matchTitle: input.matchTitle,
      evaluatorId: currentUser.id || 'user_1',
      evaluatorName: currentUser.name || 'Eren Kılıç',
      targetPlayerId: input.targetPlayerId,
      targetPlayerName: input.targetPlayerName,
      targetPlayerPosition: input.targetPlayerPosition,
      isOpponent: input.isOpponent,
      skillRating: input.skillRating,
      fairPlayRating: input.fairPlayRating,
      badges: input.badges,
      comment: input.comment?.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedEvaluations = [newEvaluation, ...evaluations];
    setEvaluations(updatedEvaluations);
    if (isSupabaseActive) {
      await supabaseService.createEvaluation(newEvaluation);
    }
    await storageService.saveEvaluations(updatedEvaluations);

    // Reward evaluator with +15 Kadro Fair-Play points for contributing to community ratings
    const currentPts = currentUser.predictionScore || 420;
    await updateUser({
      predictionScore: currentPts + 15,
    });

    return true;
  };

  const hasUserEvaluatedPlayer = (matchId: string, targetPlayerId: string): boolean => {
    return evaluations.some(
      (e) =>
        e.matchId === matchId &&
        e.targetPlayerId === targetPlayerId &&
        e.evaluatorId === (currentUser.id || 'user_1')
    );
  };

  const getPlayerEvaluations = (playerId: string): PlayerEvaluation[] => {
    return evaluations.filter((e) => e.targetPlayerId === playerId);
  };

  const resetDemoData = async () => {
    setIsLoading(true);
    if (isSupabaseActive) {
      const res = await supabaseService.resetToDemoData(
        authUser ? currentUser : undefined
      );
      setMatches(res.matches);
      setGearItems(res.gear);
      setCurrentUser(res.user);
      setLeagues(res.leagues);
      setEvaluations(res.evaluations);
      setJoinRequests(res.joinRequests);
      setIsLoading(false);
      return;
    }
    const res = await storageService.resetToDemoData();
    setMatches(res.matches);
    setGearItems(res.gear);
    setCurrentUser(res.user);
    setLeagues(res.leagues);
    setEvaluations(res.evaluations);
    setJoinRequests(res.joinRequests);
    setIsLoading(false);
  };

  return (
    <AppContext.Provider
      value={{
        matches,
        gearItems,
        leagues,
        evaluations,
        joinRequests,
        currentUser,
        isLoading,
        isSupabaseActive,
        createMatch,
        joinMatchSlot,
        leaveMatch,
        sendJoinRequest,
        cancelJoinRequest,
        approveJoinRequest,
        rejectJoinRequest,
        getMatchJoinRequests,
        getUserMatchJoinRequest,
        votePrediction,
        createGearItem,
        markGearSold,
        createLeague,
        joinLeague,
        submitPlayerEvaluation,
        hasUserEvaluatedPlayer,
        getPlayerEvaluations,
        updateUser,
        resetDemoData,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

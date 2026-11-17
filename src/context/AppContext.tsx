import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AppNotification,
  CreateGearInput,
  CreateLeagueInput,
  CreateMatchInput,
  CreateTeamInput,
  GearItem,
  JoinRequest,
  Match,
  PlayerEvaluation,
  PredictionChoice,
  RegionalLeague,
  ReportInput,
  SubmitEvaluationInput,
  Team,
  UpdateGearInput,
  UpdateLeagueInput,
  UpdateMatchInput,
  User,
} from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import {
  presentLocalNotification,
  registerForPushNotificationsAsync,
} from '../services/notificationService';
import { useAuth } from './AuthContext';
import {
  validateEvaluationInput,
  validateGearInput,
  validateLeagueInput,
  validateMatchInput,
  validateMatchScores,
  validateReportReason,
  validateTeamName,
} from '../utils/validators';

interface AppContextType {
  matches: Match[];
  gearItems: GearItem[];
  leagues: RegionalLeague[];
  teams: Team[];
  evaluations: PlayerEvaluation[];
  joinRequests: JoinRequest[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  currentUser: User;
  isLoading: boolean;
  errorMessage: string | null;
  isSupabaseActive: boolean;
  clearError: () => void;
  refreshData: () => Promise<void>;
  createMatch: (data: CreateMatchInput) => Promise<string>;
  updateMatch: (matchId: string, updates: UpdateMatchInput) => Promise<void>;
  deleteMatch: (matchId: string) => Promise<void>;
  completeMatch: (matchId: string, score1: number, score2: number) => Promise<boolean>;
  joinMatchSlot: (matchId: string, slotId: string) => Promise<boolean>;
  leaveMatch: (matchId: string) => Promise<boolean>;
  sendJoinRequest: (matchId: string, slotId: string, message?: string) => Promise<boolean>;
  cancelJoinRequest: (requestId: string) => Promise<boolean>;
  approveJoinRequest: (requestId: string) => Promise<boolean>;
  rejectJoinRequest: (requestId: string) => Promise<boolean>;
  getMatchJoinRequests: (matchId: string) => JoinRequest[];
  getUserMatchJoinRequest: (matchId: string) => JoinRequest | undefined;
  votePrediction: (matchId: string, choice: PredictionChoice) => Promise<boolean>;
  createGearItem: (data: CreateGearInput) => Promise<string>;
  updateGearItem: (gearId: string, updates: UpdateGearInput) => Promise<void>;
  deleteGearItem: (gearId: string) => Promise<void>;
  markGearSold: (gearId: string) => Promise<void>;
  createTeam: (input: CreateTeamInput) => Promise<string>;
  addTeamMember: (teamId: string, playerId: string) => Promise<void>;
  removeTeamMember: (teamId: string, playerId: string) => Promise<void>;
  transferTeamCaptain: (teamId: string, newCaptainId: string) => Promise<void>;
  searchPlayers: (query: string) => Promise<User[]>;
  createLeague: (data: CreateLeagueInput) => Promise<RegionalLeague>;
  updateLeague: (leagueId: string, updates: UpdateLeagueInput) => Promise<void>;
  deleteLeague: (leagueId: string) => Promise<void>;
  joinLeague: (
    leagueId: string,
    teamName: string,
    captainName: string,
    captainPhone?: string,
    teamId?: string
  ) => Promise<boolean>;
  generateLeagueFixtures: (league: RegionalLeague) => Promise<void>;
  recordFixtureResult: (
    fixtureId: string,
    homeScore: number,
    awayScore: number
  ) => Promise<boolean>;
  submitPlayerEvaluation: (input: SubmitEvaluationInput) => Promise<boolean>;
  hasUserEvaluatedPlayer: (matchId: string, targetPlayerId: string) => boolean;
  getPlayerEvaluations: (playerId: string) => PlayerEvaluation[];
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  submitReport: (input: ReportInput) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const EMPTY_USER: User = {
  id: '',
  name: '',
  email: '',
  phone: '',
  position: 'MID',
  rating: 4.8,
  fairPlayRating: 4.9,
  matchesPlayed: 0,
  preferredFoot: 'Right',
  city: 'İstanbul',
  district: 'Kadıköy',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authUser, isAuthenticated, isAuthLoading } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [leagues, setLeagues] = useState<RegionalLeague[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [evaluations, setEvaluations] = useState<PlayerEvaluation[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(EMPTY_USER);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSupabaseActive = Boolean(isSupabaseConfigured && authUser);

  const clearError = () => setErrorMessage(null);

  const fetchAllData = useCallback(async () => {
    if (!isSupabaseConfigured || !authUser) {
      return;
    }

    const user = await supabaseService.getUser({
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
    });

    const [
      fetchedMatches,
      fetchedGear,
      fetchedLeagues,
      fetchedTeams,
      fetchedEvaluations,
      fetchedRequests,
      fetchedNotifications,
    ] = await Promise.all([
      supabaseService.getMatches(user.id),
      supabaseService.getGearItems(),
      supabaseService.getLeagues(),
      supabaseService.getTeams(),
      supabaseService.getEvaluations(),
      supabaseService.getJoinRequests(),
      supabaseService.getNotifications(user.id),
    ]);

    setCurrentUser(user);
    setMatches(fetchedMatches);
    setGearItems(fetchedGear);
    setLeagues(fetchedLeagues);
    setTeams(fetchedTeams);
    setEvaluations(fetchedEvaluations);
    setJoinRequests(fetchedRequests);
    setNotifications(fetchedNotifications);
    setErrorMessage(null);
  }, [authUser]);

  const refreshData = useCallback(async () => {
    if (!isSupabaseConfigured || !authUser) return;
    setIsLoading(true);
    try {
      await fetchAllData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Veriler yüklenemedi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [authUser, fetchAllData]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !authUser) return;

    let isMounted = true;
    const loadInitial = async () => {
      try {
        await fetchAllData();
        const pushToken = await registerForPushNotificationsAsync();
        if (isMounted && pushToken) {
          const freshUser = await supabaseService.getUser({
            id: authUser.id,
            email: authUser.email,
            user_metadata: authUser.user_metadata,
          });
          if (freshUser.expoPushToken !== pushToken) {
            await supabaseService.saveUser(freshUser, { expoPushToken: pushToken });
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Veriler yüklenemedi.');
        }
      }
    };
    loadInitial();

    const notifChannel = supabaseService.subscribeToNotifications(
      authUser.id,
      (incoming) => {
        if (!isMounted) return;
        setNotifications((prev) =>
          prev.some((n) => n.id === incoming.id) ? prev : [incoming, ...prev]
        );
        void presentLocalNotification(incoming.title, incoming.body);
      }
    );

    const matchChannel = supabaseService.subscribeToMatchChanges(() => {
      if (!isMounted) return;
      void fetchAllData();
    });

    return () => {
      isMounted = false;
      notifChannel?.unsubscribe();
      matchChannel?.unsubscribe();
    };
  }, [authUser, fetchAllData, isAuthLoading, isAuthenticated]);

  const createMatch = async (data: CreateMatchInput): Promise<string> => {
    const check = validateMatchInput(data);
    if (!check.valid) throw new Error(check.error);

    const matchId = await supabaseService.createMatch(data, currentUser);
    await fetchAllData();
    return matchId;
  };

  const updateMatch = async (matchId: string, updates: UpdateMatchInput) => {
    await supabaseService.updateMatch(matchId, updates);
    await fetchAllData();
  };

  const deleteMatch = async (matchId: string) => {
    await supabaseService.deleteMatch(matchId);
    await fetchAllData();
  };

  const completeMatch = async (
    matchId: string,
    score1: number,
    score2: number
  ): Promise<boolean> => {
    const check = validateMatchScores(score1, score2);
    if (!check.valid) throw new Error(check.error);

    const ok = await supabaseService.completeMatch(matchId, score1, score2);
    await fetchAllData();
    return ok;
  };

  const joinMatchSlot = async (matchId: string, slotId: string): Promise<boolean> => {
    const ok = await supabaseService.joinMatchSlotAtomic(matchId, slotId);
    await fetchAllData();
    return ok;
  };

  const leaveMatch = async (matchId: string): Promise<boolean> => {
    const ok = await supabaseService.leaveMatchAtomic(matchId);
    await fetchAllData();
    return ok;
  };

  const sendJoinRequest = async (
    matchId: string,
    slotId: string,
    message?: string
  ): Promise<boolean> => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch || targetMatch.isCompleted || targetMatch.status === 'CANCELLED') {
      return false;
    }

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

    await supabaseService.createJoinRequest({
      matchId,
      slotId: targetSlot.id,
      position: targetSlot.position,
      requester: currentUser,
      message,
    });
    await fetchAllData();
    return true;
  };

  const cancelJoinRequest = async (requestId: string): Promise<boolean> => {
    const exists = joinRequests.some(
      (r) => r.id === requestId && r.requesterId === currentUser.id && r.status === 'PENDING'
    );
    if (!exists) return false;

    await supabaseService.cancelJoinRequest(requestId);
    await fetchAllData();
    return true;
  };

  const approveJoinRequest = async (requestId: string): Promise<boolean> => {
    const ok = await supabaseService.approveJoinRequest(requestId);
    await fetchAllData();
    return ok;
  };

  const rejectJoinRequest = async (requestId: string): Promise<boolean> => {
    const ok = await supabaseService.rejectJoinRequest(requestId);
    await fetchAllData();
    return ok;
  };

  const getMatchJoinRequests = (matchId: string): JoinRequest[] =>
    joinRequests.filter((r) => r.matchId === matchId);

  const getUserMatchJoinRequest = (matchId: string): JoinRequest | undefined =>
    joinRequests.find((r) => r.matchId === matchId && r.requesterId === currentUser.id);

  const votePrediction = async (
    matchId: string,
    choice: PredictionChoice
  ): Promise<boolean> => {
    const ok = await supabaseService.castPredictionVote(matchId, choice);
    await fetchAllData();
    return ok;
  };

  const createGearItem = async (data: CreateGearInput): Promise<string> => {
    const check = validateGearInput(data);
    if (!check.valid) throw new Error(check.error);

    const gearId = await supabaseService.createGearItem(data, currentUser);
    await fetchAllData();
    return gearId;
  };

  const updateGearItem = async (gearId: string, updates: UpdateGearInput) => {
    await supabaseService.updateGearItem(gearId, updates);
    await fetchAllData();
  };

  const deleteGearItem = async (gearId: string) => {
    await supabaseService.deleteGearItem(gearId);
    await fetchAllData();
  };

  const markGearSold = async (gearId: string) => {
    await supabaseService.markGearSold(gearId);
    await fetchAllData();
  };

  const createTeam = async (input: CreateTeamInput): Promise<string> => {
    const check = validateTeamName(input.name);
    if (!check.valid) throw new Error(check.error);

    const teamId = await supabaseService.createTeam(input, currentUser);
    await fetchAllData();
    return teamId;
  };

  const addTeamMember = async (teamId: string, playerId: string) => {
    await supabaseService.addTeamMember(teamId, playerId);
    await fetchAllData();
  };

  const removeTeamMember = async (teamId: string, playerId: string) => {
    await supabaseService.removeTeamMember(teamId, playerId);
    await fetchAllData();
  };

  const transferTeamCaptain = async (teamId: string, newCaptainId: string) => {
    await supabaseService.transferTeamCaptain(teamId, newCaptainId);
    await fetchAllData();
  };

  const searchPlayers = (query: string) => supabaseService.searchProfiles(query);

  const createLeague = async (data: CreateLeagueInput): Promise<RegionalLeague> => {
    const check = validateLeagueInput(data);
    if (!check.valid) throw new Error(check.error);

    const leagueId = await supabaseService.createLeague(data, currentUser);
    await fetchAllData();
    const freshLeagues = await supabaseService.getLeagues();
    const created = freshLeagues.find((l) => l.id === leagueId);
    if (!created) {
      throw new Error('Lig oluşturuldu ancak yeniden yüklenemedi.');
    }
    return created;
  };

  const updateLeague = async (leagueId: string, updates: UpdateLeagueInput) => {
    await supabaseService.updateLeague(leagueId, updates);
    await fetchAllData();
  };

  const deleteLeague = async (leagueId: string) => {
    await supabaseService.deleteLeague(leagueId);
    await fetchAllData();
  };

  const joinLeague = async (
    leagueId: string,
    teamName: string,
    captainName: string,
    captainPhone?: string,
    teamId?: string
  ): Promise<boolean> => {
    const check = validateTeamName(teamName, captainName);
    if (!check.valid) throw new Error(check.error);

    await supabaseService.registerTeamToLeague({
      leagueId,
      teamName,
      captainName,
      captainPhone: captainPhone || currentUser.phone,
      teamId,
    });
    await fetchAllData();
    return true;
  };

  const generateLeagueFixtures = async (league: RegionalLeague) => {
    await supabaseService.generateLeagueRoundRobinFixtures(league);
    await fetchAllData();
  };

  const recordFixtureResult = async (
    fixtureId: string,
    homeScore: number,
    awayScore: number
  ): Promise<boolean> => {
    const check = validateMatchScores(homeScore, awayScore);
    if (!check.valid) throw new Error(check.error);

    const ok = await supabaseService.recordLeagueFixtureResult(
      fixtureId,
      homeScore,
      awayScore
    );
    await fetchAllData();
    return ok;
  };

  const submitPlayerEvaluation = async (
    input: SubmitEvaluationInput
  ): Promise<boolean> => {
    const targetMatch = matches.find((m) => m.id === input.matchId);
    if (!targetMatch?.isCompleted) {
      throw new Error('Değerlendirme yalnızca tamamlanmış maçlar için yapılabilir.');
    }

    const check = validateEvaluationInput(input, currentUser.id);
    if (!check.valid) throw new Error(check.error);

    if (hasUserEvaluatedPlayer(input.matchId, input.targetPlayerId)) {
      return false;
    }

    await supabaseService.createEvaluation(input, currentUser);
    await fetchAllData();
    return true;
  };

  const hasUserEvaluatedPlayer = (matchId: string, targetPlayerId: string): boolean =>
    evaluations.some(
      (e) =>
        e.matchId === matchId &&
        e.targetPlayerId === targetPlayerId &&
        e.evaluatorId === currentUser.id
    );

  const getPlayerEvaluations = (playerId: string): PlayerEvaluation[] =>
    evaluations.filter((e) => e.targetPlayerId === playerId);

  const markNotificationRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    await supabaseService.markNotificationRead(notificationId);
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await supabaseService.markAllNotificationsRead(currentUser.id);
  };

  const submitReport = async (input: ReportInput) => {
    const check = validateReportReason(input.reason);
    if (!check.valid) throw new Error(check.error);
    await supabaseService.submitReport(currentUser.id, input);
  };

  const updateUser = async (updates: Partial<User>) => {
    await supabaseService.saveUser(currentUser, updates);
    await fetchAllData();
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        matches,
        gearItems,
        leagues,
        teams,
        evaluations,
        joinRequests,
        notifications,
        unreadNotificationsCount,
        currentUser,
        isLoading,
        errorMessage,
        isSupabaseActive,
        clearError,
        refreshData,
        createMatch,
        updateMatch,
        deleteMatch,
        completeMatch,
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
        updateGearItem,
        deleteGearItem,
        markGearSold,
        createTeam,
        addTeamMember,
        removeTeamMember,
        transferTeamCaptain,
        searchPlayers,
        createLeague,
        updateLeague,
        deleteLeague,
        joinLeague,
        generateLeagueFixtures,
        recordFixtureResult,
        submitPlayerEvaluation,
        hasUserEvaluatedPlayer,
        getPlayerEvaluations,
        markNotificationRead,
        markAllNotificationsRead,
        submitReport,
        updateUser,
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

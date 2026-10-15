export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export type MatchFormat = '5v5' | '6v6' | '7v7' | '8v8';

export type PredictionChoice = '1' | 'X' | '2';

export interface MatchPrediction {
  team1Name: string;
  team2Name: string;
  votesTeam1: number;
  votesDraw: number;
  votesTeam2: number;
  userVote?: PredictionChoice;
  category?: 'Derbi' | 'Haftanın Maçı' | 'Normal';
}

export interface PlayerBadge {
  id: string;
  label: string;
  icon: string;
  count: number;
}

export interface PlayerEvaluation {
  id: string;
  matchId: string;
  matchTitle: string;
  evaluatorId: string;
  evaluatorName: string;
  targetPlayerId: string;
  targetPlayerName: string;
  targetPlayerPosition?: PlayerPosition;
  isOpponent: boolean;
  skillRating: number; // 1 to 5
  fairPlayRating: number; // 1 to 5
  badges: string[];
  comment?: string;
  createdAt: string;
}

export interface SubmitEvaluationInput {
  matchId: string;
  matchTitle: string;
  targetPlayerId: string;
  targetPlayerName: string;
  targetPlayerPosition?: PlayerPosition;
  isOpponent: boolean;
  skillRating: number;
  fairPlayRating: number;
  badges: string[];
  comment?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: PlayerPosition;
  rating: number;
  fairPlayRating?: number;
  matchesPlayed: number;
  preferredFoot: 'Right' | 'Left' | 'Both';
  city: string;
  district: string;
  avatarUrl?: string;
  bio?: string;
  predictionScore?: number;
  totalPredictions?: number;
  correctPredictions?: number;
  badges?: PlayerBadge[];
  evaluationsCount?: number;
}

export interface RosterSlot {
  id: string;
  position: PlayerPosition;
  isFilled: boolean;
  assignedPlayer?: {
    id: string;
    name: string;
    phone?: string;
    rating?: number;
    fairPlayRating?: number;
  };
  isOrganizer?: boolean;
}

export interface Match {
  id: string;
  title: string;
  organizerId: string;
  organizerName: string;
  organizerPhone: string;
  venueName: string;
  address: string;
  city: string;
  district: string;
  date: string; // e.g. "2026-10-18"
  time: string; // e.g. "21:00 - 22:00"
  format: MatchFormat;
  pitchType: 'Açık Saha' | 'Kapalı Saha';
  feePerPlayer: number;
  totalSlots: number;
  roster: RosterSlot[];
  missingPositions: PlayerPosition[];
  notes?: string;
  isJoined?: boolean;
  isCompleted?: boolean;
  finalScore?: { team1: number; team2: number };
  createdAt: string;
  prediction?: MatchPrediction;
}

export type GearCategory = 'Boots' | 'Jerseys' | 'Gloves' | 'Equipment';
export type GearCondition = 'Sıfır (Etiketli)' | 'Çok İyi (Az Kullanılmış)' | 'İyi' | 'Kullanılmış';

export interface GearItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  title: string;
  description: string;
  category: GearCategory;
  brand: string;
  size: string;
  price: number;
  condition: GearCondition;
  location: string;
  status: 'Available' | 'Sold';
  createdAt: string;
  iconName?: string;
}

export type LeagueStatus = 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export interface LeagueTeam {
  id: string;
  name: string;
  logoEmoji: string;
  captainName: string;
  captainPhone?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface LeagueFixture {
  id: string;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  date: string;
  time: string;
  venue: string;
  isFinished: boolean;
}

export interface RegionalLeague {
  id: string;
  title: string;
  season: string;
  city: string;
  district: string;
  venueName: string;
  format: MatchFormat;
  status: LeagueStatus;
  maxTeams: number;
  registeredTeamsCount: number;
  entryFee: number;
  prize: string;
  organizerName: string;
  organizerPhone: string;
  description: string;
  rules: string[];
  teams: LeagueTeam[];
  fixtures: LeagueFixture[];
  themeColor: string;
  createdAt: string;
}

export interface CreateLeagueInput {
  title: string;
  season: string;
  city: string;
  district: string;
  venueName: string;
  format: MatchFormat;
  maxTeams: number;
  entryFee: number;
  prize: string;
  rules: string[];
  description: string;
  themeColor?: string;
}


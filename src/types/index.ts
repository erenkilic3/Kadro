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

export interface TeamRecentMatch {
  id: string;
  opponentName: string;
  goalsFor: number;
  goalsAgainst: number;
  result: 'W' | 'D' | 'L';
  date: string;
  competition?: string;
}

export interface TeamMatchStats {
  teamName: string;
  logoEmoji?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets?: number;
  form: ('W' | 'D' | 'L')[];
  recentMatches?: TeamRecentMatch[];
}

export interface HeadToHeadMatch {
  id: string;
  date: string;
  team1Goals: number;
  team2Goals: number;
  venue?: string;
}

export interface HeadToHeadStats {
  totalMatches: number;
  team1Wins: number;
  draws: number;
  team2Wins: number;
  team1Goals: number;
  team2Goals: number;
  recentMeetings?: HeadToHeadMatch[];
}

export interface MatchupStats {
  team1: TeamMatchStats;
  team2: TeamMatchStats;
  headToHead?: HeadToHeadStats;
}

export interface AiMatchPrediction {
  predictedScore1: number;
  predictedScore2: number;
  recommendedOutcome: PredictionChoice;
  recommendedLabel: string;
  probTeam1: number;
  probDraw: number;
  probTeam2: number;
  confidence: number;
  dataQuality: 'Yüksek Veri' | 'Orta Veri' | 'İlk Analiz';
  expectedTotalGoals: number;
  overUnderLine: number;
  overUnderPick: 'ÜST' | 'ALT';
  bttsYes: boolean;
  bttsProbability: number;
  insights: string[];
}

export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface JoinRequest {
  id: string;
  matchId: string;
  slotId: string;
  position: PlayerPosition;
  requesterId: string;
  requesterName: string;
  requesterPhone?: string;
  requesterRating: number;
  requesterFairPlay?: number;
  message?: string;
  status: JoinRequestStatus;
  createdAt: string;
  respondedAt?: string;
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

export interface Venue {
  id: string;
  name: string;
  city: string;
  district: string;
  address?: string;
  pitchType: 'Açık Saha' | 'Kapalı Saha';
  overallRating: number;
  turfRating: number;
  lightingRating: number;
  lockerRoomRating: number;
  organizationRating: number;
  evaluationsCount: number;
  amenities: string[];
  createdAt: string;
}

export interface VenueEvaluation {
  id: string;
  venueId: string;
  matchId: string;
  evaluatorId: string;
  evaluatorName: string;
  overallRating: number;
  turfRating: number;
  lightingRating: number;
  lockerRoomRating: number;
  organizationRating: number;
  highlights: string[];
  comment?: string;
  createdAt: string;
}

export interface SubmitVenueEvaluationInput {
  matchId: string;
  venueId?: string;
  turfRating: number;
  lightingRating: number;
  lockerRoomRating: number;
  organizationRating: number;
  highlights: string[];
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
  expoPushToken?: string;
  pushEnabled?: boolean;
}

export interface RosterSlot {
  id: string;
  position: PlayerPosition;
  teamSide?: 1 | 2;
  slotOrder?: number;
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

export type MatchStatus = 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED';

export interface Match {
  id: string;
  title: string;
  organizerId: string;
  organizerName: string;
  organizerPhone: string;
  venueId?: string;
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
  status?: MatchStatus;
  isJoined?: boolean;
  isCompleted?: boolean;
  finalScore?: { team1: number; team2: number };
  createdAt: string;
  prediction?: MatchPrediction;
  matchupStats?: MatchupStats;
}

export interface CreateMatchInput {
  title: string;
  venueName: string;
  address: string;
  city?: string;
  district: string;
  date: string;
  time: string;
  format: MatchFormat;
  pitchType: 'Açık Saha' | 'Kapalı Saha';
  feePerPlayer: number;
  missingPositions: PlayerPosition[];
  notes?: string;
}

export interface UpdateMatchInput {
  title?: string;
  venueName?: string;
  address?: string;
  city?: string;
  district?: string;
  date?: string;
  time?: string;
  pitchType?: 'Açık Saha' | 'Kapalı Saha';
  feePerPlayer?: number;
  notes?: string;
  status?: MatchStatus;
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
  city?: string;
  district?: string;
  location: string;
  imageUrl?: string;
  status: 'Available' | 'Sold';
  createdAt: string;
  iconName?: string;
}

export interface CreateGearInput {
  title: string;
  description: string;
  category: GearCategory;
  brand: string;
  size: string;
  price: number;
  condition: GearCondition;
  city?: string;
  district?: string;
  location: string;
  imageUrl?: string;
}

export interface UpdateGearInput {
  title?: string;
  description?: string;
  category?: GearCategory;
  brand?: string;
  size?: string;
  price?: number;
  condition?: GearCondition;
  city?: string;
  district?: string;
  location?: string;
  imageUrl?: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  playerId: string;
  playerName: string;
  playerPosition?: PlayerPosition;
  playerRating?: number;
  role: 'CAPTAIN' | 'PLAYER';
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  logoEmoji: string;
  captainId: string;
  city: string;
  district: string;
  format: MatchFormat;
  bio?: string;
  members: TeamMember[];
  createdAt: string;
}

export interface CreateTeamInput {
  name: string;
  city: string;
  district: string;
  format: MatchFormat;
  bio?: string;
  logoEmoji?: string;
}

export type LeagueStatus = 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export interface LeagueTeam {
  id: string;
  teamId?: string;
  captainId?: string;
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
  homeTeamId?: string;
  awayTeamId?: string;
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
  organizerId?: string;
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

export interface UpdateLeagueInput {
  title?: string;
  season?: string;
  city?: string;
  district?: string;
  venueName?: string;
  entryFee?: number;
  prize?: string;
  status?: LeagueStatus;
  rules?: string[];
  description?: string;
  themeColor?: string;
}

export type NotificationType =
  | 'JOIN_REQUEST_RECEIVED'
  | 'JOIN_REQUEST_APPROVED'
  | 'JOIN_REQUEST_REJECTED'
  | 'MATCH_UPDATED'
  | 'LEAGUE_UPDATED'
  | 'GEAR_UPDATED';

export type NotificationEntityType =
  | 'MATCH'
  | 'JOIN_REQUEST'
  | 'LEAGUE'
  | 'GEAR'
  | 'EVALUATION';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: NotificationEntityType;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export type ReportTargetType = 'PLAYER' | 'MATCH' | 'GEAR' | 'LEAGUE';

export interface ReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}


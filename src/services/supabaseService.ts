import { supabase } from '../lib/supabase';
import {
  GearCategory,
  GearCondition,
  GearItem,
  JoinRequest,
  JoinRequestStatus,
  LeagueFixture,
  LeagueStatus,
  LeagueTeam,
  Match,
  MatchFormat,
  MatchPrediction,
  MatchupStats,
  PlayerBadge,
  PlayerEvaluation,
  PlayerPosition,
  RegionalLeague,
  RosterSlot,
  User,
} from '../types';
import {
  INITIAL_EVALUATIONS,
  INITIAL_GEAR_ITEMS,
  INITIAL_JOIN_REQUESTS,
  INITIAL_LEAGUES,
  INITIAL_MATCHES,
  INITIAL_USER,
} from '../constants/mockData';

interface ProfileRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: PlayerPosition;
  rating: number | string;
  fair_play_rating: number | string | null;
  matches_played: number;
  preferred_foot: 'Right' | 'Left' | 'Both';
  city: string;
  district: string;
  avatar_url: string | null;
  bio: string | null;
  prediction_score: number | null;
  total_predictions: number | null;
  correct_predictions: number | null;
  evaluations_count: number | null;
  badges: PlayerBadge[] | null;
}

interface RosterSlotRow {
  id: string;
  match_id: string;
  slot_order: number;
  position: PlayerPosition;
  is_filled: boolean;
  assigned_player_id: string | null;
  assigned_player_name: string | null;
  assigned_player_phone: string | null;
  assigned_player_rating: number | string | null;
  assigned_player_fair_play: number | string | null;
  is_organizer: boolean;
}

interface MatchRow {
  id: string;
  title: string;
  organizer_id: string;
  organizer_name: string;
  organizer_phone: string;
  venue_name: string;
  address: string;
  city: string;
  district: string;
  date_label: string;
  time_range: string;
  format: MatchFormat;
  pitch_type: 'Açık Saha' | 'Kapalı Saha';
  fee_per_player: number;
  total_slots: number;
  missing_positions: PlayerPosition[];
  notes: string | null;
  is_completed: boolean;
  final_score_team1: number | null;
  final_score_team2: number | null;
  prediction: MatchPrediction | null;
  matchup_stats: MatchupStats | null;
  created_at: string;
}

interface JoinRequestRow {
  id: string;
  match_id: string;
  slot_id: string;
  position: PlayerPosition;
  requester_id: string;
  requester_name: string;
  requester_phone: string | null;
  requester_rating: number | string;
  requester_fair_play: number | string | null;
  message: string | null;
  status: JoinRequestStatus;
  created_at: string;
  responded_at: string | null;
}

interface LeagueRow {
  id: string;
  title: string;
  season: string;
  city: string;
  district: string;
  venue_name: string;
  format: MatchFormat;
  status: LeagueStatus;
  max_teams: number;
  registered_teams_count: number;
  entry_fee: number;
  prize: string;
  organizer_name: string;
  organizer_phone: string;
  description: string;
  rules: string[];
  theme_color: string;
  created_at: string;
}

interface LeagueTeamRow {
  id: string;
  league_id: string;
  name: string;
  logo_emoji: string;
  captain_name: string;
  captain_phone: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

interface LeagueFixtureRow {
  id: string;
  league_id: string;
  week: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  date_label: string;
  time_label: string;
  venue: string;
  is_finished: boolean;
}

interface EvaluationRow {
  id: string;
  match_id: string;
  match_title: string;
  evaluator_id: string;
  evaluator_name: string;
  target_player_id: string;
  target_player_name: string;
  target_player_position: PlayerPosition | null;
  is_opponent: boolean;
  skill_rating: number;
  fair_play_rating: number;
  badges: string[];
  comment: string | null;
  created_at: string;
}

interface GearRow {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_phone: string;
  title: string;
  description: string;
  category: GearCategory;
  brand: string;
  size: string;
  price: number;
  condition: GearCondition;
  location: string;
  status: 'Available' | 'Sold';
  icon_name: string | null;
  created_at: string;
}

function getClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }
  return supabase;
}

function mapProfileRow(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email || '',
    phone: row.phone || '',
    position: row.position,
    rating: Number(row.rating),
    fairPlayRating: row.fair_play_rating !== null ? Number(row.fair_play_rating) : undefined,
    matchesPlayed: row.matches_played,
    preferredFoot: row.preferred_foot,
    city: row.city,
    district: row.district,
    avatarUrl: row.avatar_url || undefined,
    bio: row.bio || undefined,
    predictionScore: row.prediction_score ?? 0,
    totalPredictions: row.total_predictions ?? 0,
    correctPredictions: row.correct_predictions ?? 0,
    evaluationsCount: row.evaluations_count ?? 0,
    badges: row.badges ?? [],
  };
}

function toProfileRow(user: User): ProfileRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email || null,
    phone: user.phone || null,
    position: user.position,
    rating: user.rating,
    fair_play_rating: user.fairPlayRating ?? null,
    matches_played: user.matchesPlayed,
    preferred_foot: user.preferredFoot,
    city: user.city,
    district: user.district,
    avatar_url: user.avatarUrl || null,
    bio: user.bio || null,
    prediction_score: user.predictionScore ?? 0,
    total_predictions: user.totalPredictions ?? 0,
    correct_predictions: user.correctPredictions ?? 0,
    evaluations_count: user.evaluationsCount ?? 0,
    badges: user.badges ?? [],
  };
}

function toMatchRow(match: Match): MatchRow {
  return {
    id: match.id,
    title: match.title,
    organizer_id: match.organizerId,
    organizer_name: match.organizerName,
    organizer_phone: match.organizerPhone,
    venue_name: match.venueName,
    address: match.address,
    city: match.city,
    district: match.district,
    date_label: match.date,
    time_range: match.time,
    format: match.format,
    pitch_type: match.pitchType,
    fee_per_player: match.feePerPlayer,
    total_slots: match.totalSlots,
    missing_positions: match.missingPositions,
    notes: match.notes || null,
    is_completed: Boolean(match.isCompleted),
    final_score_team1: match.finalScore?.team1 ?? null,
    final_score_team2: match.finalScore?.team2 ?? null,
    prediction: match.prediction ?? null,
    matchup_stats: match.matchupStats ?? null,
    created_at: match.createdAt,
  };
}

function toRosterSlotRows(matchId: string, roster: RosterSlot[]): RosterSlotRow[] {
  return roster.map((slot, index) => ({
    id: slot.id,
    match_id: matchId,
    slot_order: index,
    position: slot.position,
    is_filled: slot.isFilled,
    assigned_player_id: slot.assignedPlayer?.id ?? null,
    assigned_player_name: slot.assignedPlayer?.name ?? null,
    assigned_player_phone: slot.assignedPlayer?.phone ?? null,
    assigned_player_rating: slot.assignedPlayer?.rating ?? null,
    assigned_player_fair_play: slot.assignedPlayer?.fairPlayRating ?? null,
    is_organizer: Boolean(slot.isOrganizer),
  }));
}

function mapMatchRows(
  matchRows: MatchRow[],
  slotRows: RosterSlotRow[],
  currentUserId: string
): Match[] {
  const slotsByMatch = new Map<string, RosterSlotRow[]>();
  for (const row of slotRows) {
    const existing = slotsByMatch.get(row.match_id) || [];
    existing.push(row);
    slotsByMatch.set(row.match_id, existing);
  }

  return matchRows.map((row) => {
    const rawSlots = (slotsByMatch.get(row.id) || []).sort(
      (a, b) => a.slot_order - b.slot_order
    );
    const roster: RosterSlot[] = rawSlots.map((s) => ({
      id: s.id,
      position: s.position,
      isFilled: s.is_filled,
      isOrganizer: s.is_organizer,
      assignedPlayer:
        s.is_filled && s.assigned_player_id && s.assigned_player_name
          ? {
              id: s.assigned_player_id,
              name: s.assigned_player_name,
              phone: s.assigned_player_phone || undefined,
              rating:
                s.assigned_player_rating !== null
                  ? Number(s.assigned_player_rating)
                  : undefined,
              fairPlayRating:
                s.assigned_player_fair_play !== null
                  ? Number(s.assigned_player_fair_play)
                  : undefined,
            }
          : undefined,
    }));

    return {
      id: row.id,
      title: row.title,
      organizerId: row.organizer_id,
      organizerName: row.organizer_name,
      organizerPhone: row.organizer_phone,
      venueName: row.venue_name,
      address: row.address,
      city: row.city,
      district: row.district,
      date: row.date_label,
      time: row.time_range,
      format: row.format,
      pitchType: row.pitch_type,
      feePerPlayer: row.fee_per_player,
      totalSlots: row.total_slots,
      roster,
      missingPositions: row.missing_positions || [],
      notes: row.notes || undefined,
      isJoined: roster.some((s) => s.assignedPlayer?.id === currentUserId),
      isCompleted: row.is_completed,
      finalScore:
        row.final_score_team1 !== null && row.final_score_team2 !== null
          ? { team1: row.final_score_team1, team2: row.final_score_team2 }
          : undefined,
      createdAt: row.created_at,
      prediction: row.prediction || undefined,
      matchupStats: row.matchup_stats || undefined,
    };
  });
}

function mapJoinRequestRow(row: JoinRequestRow): JoinRequest {
  return {
    id: row.id,
    matchId: row.match_id,
    slotId: row.slot_id,
    position: row.position,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    requesterPhone: row.requester_phone || undefined,
    requesterRating: Number(row.requester_rating),
    requesterFairPlay:
      row.requester_fair_play !== null ? Number(row.requester_fair_play) : undefined,
    message: row.message || undefined,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at || undefined,
  };
}

function toJoinRequestRow(req: JoinRequest): JoinRequestRow {
  return {
    id: req.id,
    match_id: req.matchId,
    slot_id: req.slotId,
    position: req.position,
    requester_id: req.requesterId,
    requester_name: req.requesterName,
    requester_phone: req.requesterPhone || null,
    requester_rating: req.requesterRating,
    requester_fair_play: req.requesterFairPlay ?? null,
    message: req.message || null,
    status: req.status,
    created_at: req.createdAt,
    responded_at: req.respondedAt || null,
  };
}

function mapGearRow(row: GearRow): GearItem {
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    sellerPhone: row.seller_phone,
    title: row.title,
    description: row.description,
    category: row.category,
    brand: row.brand,
    size: row.size,
    price: row.price,
    condition: row.condition,
    location: row.location,
    status: row.status,
    iconName: row.icon_name || undefined,
    createdAt: row.created_at,
  };
}

function toGearRow(item: GearItem): GearRow {
  return {
    id: item.id,
    seller_id: item.sellerId,
    seller_name: item.sellerName,
    seller_phone: item.sellerPhone,
    title: item.title,
    description: item.description,
    category: item.category,
    brand: item.brand,
    size: item.size,
    price: item.price,
    condition: item.condition,
    location: item.location,
    status: item.status,
    icon_name: item.iconName || null,
    created_at: item.createdAt,
  };
}

function mapLeagueTeamRow(row: LeagueTeamRow): LeagueTeam {
  return {
    id: row.id,
    name: row.name,
    logoEmoji: row.logo_emoji,
    captainName: row.captain_name,
    captainPhone: row.captain_phone || undefined,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goals_for,
    goalsAgainst: row.goals_against,
    goalDifference: row.goal_difference,
    points: row.points,
    form: row.form || [],
  };
}

function toLeagueTeamRow(leagueId: string, team: LeagueTeam): LeagueTeamRow {
  return {
    id: team.id,
    league_id: leagueId,
    name: team.name,
    logo_emoji: team.logoEmoji,
    captain_name: team.captainName,
    captain_phone: team.captainPhone || null,
    played: team.played,
    won: team.won,
    drawn: team.drawn,
    lost: team.lost,
    goals_for: team.goalsFor,
    goals_against: team.goalsAgainst,
    goal_difference: team.goalDifference,
    points: team.points,
    form: team.form,
  };
}

function mapLeagueFixtureRow(row: LeagueFixtureRow): LeagueFixture {
  return {
    id: row.id,
    week: row.week,
    homeTeamName: row.home_team_name,
    awayTeamName: row.away_team_name,
    homeScore: row.home_score ?? undefined,
    awayScore: row.away_score ?? undefined,
    date: row.date_label,
    time: row.time_label,
    venue: row.venue,
    isFinished: row.is_finished,
  };
}

function toLeagueFixtureRow(leagueId: string, fix: LeagueFixture): LeagueFixtureRow {
  return {
    id: fix.id,
    league_id: leagueId,
    week: fix.week,
    home_team_name: fix.homeTeamName,
    away_team_name: fix.awayTeamName,
    home_score: fix.homeScore ?? null,
    away_score: fix.awayScore ?? null,
    date_label: fix.date,
    time_label: fix.time,
    venue: fix.venue,
    is_finished: fix.isFinished,
  };
}

function mapEvaluationRow(row: EvaluationRow): PlayerEvaluation {
  return {
    id: row.id,
    matchId: row.match_id,
    matchTitle: row.match_title,
    evaluatorId: row.evaluator_id,
    evaluatorName: row.evaluator_name,
    targetPlayerId: row.target_player_id,
    targetPlayerName: row.target_player_name,
    targetPlayerPosition: row.target_player_position || undefined,
    isOpponent: row.is_opponent,
    skillRating: row.skill_rating,
    fairPlayRating: row.fair_play_rating,
    badges: row.badges || [],
    comment: row.comment || undefined,
    createdAt: row.created_at,
  };
}

function toEvaluationRow(ev: PlayerEvaluation): EvaluationRow {
  return {
    id: ev.id,
    match_id: ev.matchId,
    match_title: ev.matchTitle,
    evaluator_id: ev.evaluatorId,
    evaluator_name: ev.evaluatorName,
    target_player_id: ev.targetPlayerId,
    target_player_name: ev.targetPlayerName,
    target_player_position: ev.targetPlayerPosition || null,
    is_opponent: ev.isOpponent,
    skill_rating: ev.skillRating,
    fair_play_rating: ev.fairPlayRating,
    badges: ev.badges,
    comment: ev.comment || null,
    created_at: ev.createdAt,
  };
}

export interface AuthProfileSeed {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

function buildNewAuthUserProfile(seed: AuthProfileSeed): User {
  const meta = seed.user_metadata || {};
  const metaName = typeof meta.name === 'string' ? meta.name.trim() : '';
  const emailName = seed.email ? seed.email.split('@')[0] : '';
  const metaPosition =
    meta.position === 'GK' ||
    meta.position === 'DEF' ||
    meta.position === 'MID' ||
    meta.position === 'FWD'
      ? meta.position
      : 'MID';

  return {
    ...INITIAL_USER,
    id: seed.id,
    name: metaName || emailName || 'Yeni Oyuncu',
    email: seed.email || INITIAL_USER.email,
    phone: '',
    position: metaPosition,
    city: typeof meta.city === 'string' && meta.city.trim() ? meta.city.trim() : 'İstanbul',
    district:
      typeof meta.district === 'string' && meta.district.trim()
        ? meta.district.trim()
        : 'Kadıköy',
    matchesPlayed: 0,
    predictionScore: 0,
    totalPredictions: 0,
    correctPredictions: 0,
    evaluationsCount: 0,
    badges: [],
  };
}

export const supabaseService = {
  async getUser(authSeed?: AuthProfileSeed | string): Promise<User> {
    const client = getClient();
    const userId =
      typeof authSeed === 'string' ? authSeed : authSeed?.id || INITIAL_USER.id;

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const newProfile =
        typeof authSeed === 'object' && authSeed?.id
          ? buildNewAuthUserProfile(authSeed)
          : INITIAL_USER;
      await client.from('profiles').upsert(toProfileRow(newProfile));
      return newProfile;
    }
    return mapProfileRow(data as ProfileRow);
  },

  async saveUser(user: User): Promise<void> {
    const client = getClient();
    const { error } = await client.from('profiles').upsert(toProfileRow(user));
    if (error) throw error;
  },

  async getMatches(currentUserId = INITIAL_USER.id): Promise<Match[]> {
    const client = getClient();
    const { data: matchRows, error: matchErr } = await client
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });

    if (matchErr) throw matchErr;

    if (!matchRows || matchRows.length === 0) {
      await this.seedMatchesAndRequests();
      return INITIAL_MATCHES;
    }

    const { data: slotRows, error: slotErr } = await client
      .from('roster_slots')
      .select('*')
      .order('slot_order', { ascending: true });

    if (slotErr) throw slotErr;

    return mapMatchRows(
      matchRows as MatchRow[],
      (slotRows || []) as RosterSlotRow[],
      currentUserId
    );
  },

  async createMatch(match: Match): Promise<void> {
    const client = getClient();
    const { error: matchErr } = await client.from('matches').insert(toMatchRow(match));
    if (matchErr) throw matchErr;

    if (match.roster.length > 0) {
      const { error: slotErr } = await client
        .from('roster_slots')
        .insert(toRosterSlotRows(match.id, match.roster));
      if (slotErr) throw slotErr;
    }
  },

  async updateMatchRoster(
    matchId: string,
    roster: RosterSlot[],
    missingPositions: PlayerPosition[]
  ): Promise<void> {
    const client = getClient();
    const { error: slotErr } = await client
      .from('roster_slots')
      .upsert(toRosterSlotRows(matchId, roster), { onConflict: 'match_id,id' });
    if (slotErr) throw slotErr;

    const { error: matchErr } = await client
      .from('matches')
      .update({ missing_positions: missingPositions })
      .eq('id', matchId);
    if (matchErr) throw matchErr;
  },

  async updateMatchPrediction(
    matchId: string,
    prediction: MatchPrediction
  ): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('matches')
      .update({ prediction })
      .eq('id', matchId);
    if (error) throw error;
  },

  async getJoinRequests(): Promise<JoinRequest[]> {
    const client = getClient();
    const { data, error } = await client
      .from('join_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data || []) as JoinRequestRow[]).map(mapJoinRequestRow);
  },

  async createJoinRequest(req: JoinRequest): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('join_requests')
      .insert(toJoinRequestRow(req));
    if (error) throw error;
  },

  async cancelJoinRequest(requestId: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('join_requests')
      .delete()
      .eq('id', requestId)
      .eq('status', 'PENDING');
    if (error) throw error;
  },

  async approveJoinRequest(requestId: string): Promise<boolean> {
    const client = getClient();
    const { data, error } = await client.rpc('approve_join_request', {
      p_request_id: requestId,
    });
    if (error) throw error;
    return Boolean(data);
  },

  async rejectJoinRequest(requestId: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('join_requests')
      .update({
        status: 'REJECTED',
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('status', 'PENDING');
    if (error) throw error;
  },

  async getGearItems(): Promise<GearItem[]> {
    const client = getClient();
    const { data, error } = await client
      .from('gear_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      await client.from('gear_items').upsert(INITIAL_GEAR_ITEMS.map(toGearRow));
      return INITIAL_GEAR_ITEMS;
    }
    return (data as GearRow[]).map(mapGearRow);
  },

  async createGearItem(item: GearItem): Promise<void> {
    const client = getClient();
    const { error } = await client.from('gear_items').insert(toGearRow(item));
    if (error) throw error;
  },

  async markGearSold(gearId: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('gear_items')
      .update({ status: 'Sold' })
      .eq('id', gearId);
    if (error) throw error;
  },

  async getLeagues(): Promise<RegionalLeague[]> {
    const client = getClient();
    const { data: leagueRows, error: leagueErr } = await client
      .from('leagues')
      .select('*')
      .order('created_at', { ascending: false });

    if (leagueErr) throw leagueErr;
    if (!leagueRows || leagueRows.length === 0) {
      await this.seedLeagues();
      return INITIAL_LEAGUES;
    }

    const [{ data: teamRows, error: teamErr }, { data: fixRows, error: fixErr }] =
      await Promise.all([
        client.from('league_teams').select('*'),
        client.from('league_fixtures').select('*'),
      ]);

    if (teamErr) throw teamErr;
    if (fixErr) throw fixErr;

    const teamsByLeague = new Map<string, LeagueTeam[]>();
    for (const row of (teamRows || []) as LeagueTeamRow[]) {
      const list = teamsByLeague.get(row.league_id) || [];
      list.push(mapLeagueTeamRow(row));
      teamsByLeague.set(row.league_id, list);
    }

    const fixturesByLeague = new Map<string, LeagueFixture[]>();
    for (const row of (fixRows || []) as LeagueFixtureRow[]) {
      const list = fixturesByLeague.get(row.league_id) || [];
      list.push(mapLeagueFixtureRow(row));
      fixturesByLeague.set(row.league_id, list);
    }

    return (leagueRows as LeagueRow[]).map((l) => ({
      id: l.id,
      title: l.title,
      season: l.season,
      city: l.city,
      district: l.district,
      venueName: l.venue_name,
      format: l.format,
      status: l.status,
      maxTeams: l.max_teams,
      registeredTeamsCount: l.registered_teams_count,
      entryFee: l.entry_fee,
      prize: l.prize,
      organizerName: l.organizer_name,
      organizerPhone: l.organizer_phone,
      description: l.description,
      rules: l.rules || [],
      themeColor: l.theme_color,
      createdAt: l.created_at,
      teams: teamsByLeague.get(l.id) || [],
      fixtures: fixturesByLeague.get(l.id) || [],
    }));
  },

  async createLeague(league: RegionalLeague): Promise<void> {
    const client = getClient();
    const { error: leagueErr } = await client.from('leagues').insert({
      id: league.id,
      title: league.title,
      season: league.season,
      city: league.city,
      district: league.district,
      venue_name: league.venueName,
      format: league.format,
      status: league.status,
      max_teams: league.maxTeams,
      registered_teams_count: league.registeredTeamsCount,
      entry_fee: league.entryFee,
      prize: league.prize,
      organizer_name: league.organizerName,
      organizer_phone: league.organizerPhone,
      description: league.description,
      rules: league.rules,
      theme_color: league.themeColor,
      created_at: league.createdAt,
    });
    if (leagueErr) throw leagueErr;

    if (league.teams.length > 0) {
      const { error: teamErr } = await client
        .from('league_teams')
        .insert(league.teams.map((t) => toLeagueTeamRow(league.id, t)));
      if (teamErr) throw teamErr;
    }

    if (league.fixtures.length > 0) {
      const { error: fixErr } = await client
        .from('league_fixtures')
        .insert(league.fixtures.map((f) => toLeagueFixtureRow(league.id, f)));
      if (fixErr) throw fixErr;
    }
  },

  async addTeamToLeague(
    leagueId: string,
    team: LeagueTeam,
    newCount: number,
    newStatus: LeagueStatus
  ): Promise<void> {
    const client = getClient();
    const { error: teamErr } = await client
      .from('league_teams')
      .insert(toLeagueTeamRow(leagueId, team));
    if (teamErr) throw teamErr;

    const { error: leagueErr } = await client
      .from('leagues')
      .update({ registered_teams_count: newCount, status: newStatus })
      .eq('id', leagueId);
    if (leagueErr) throw leagueErr;
  },

  async getEvaluations(): Promise<PlayerEvaluation[]> {
    const client = getClient();
    const { data, error } = await client
      .from('player_evaluations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      await client
        .from('player_evaluations')
        .upsert(INITIAL_EVALUATIONS.map(toEvaluationRow));
      return INITIAL_EVALUATIONS;
    }
    return (data as EvaluationRow[]).map(mapEvaluationRow);
  },

  async createEvaluation(ev: PlayerEvaluation): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('player_evaluations')
      .insert(toEvaluationRow(ev));
    if (error) throw error;
  },

  async seedMatchesAndRequests(): Promise<void> {
    const client = getClient();
    await client.from('matches').upsert(INITIAL_MATCHES.map(toMatchRow));
    const allSlots = INITIAL_MATCHES.flatMap((m) => toRosterSlotRows(m.id, m.roster));
    if (allSlots.length > 0) {
      await client
        .from('roster_slots')
        .upsert(allSlots, { onConflict: 'match_id,id' });
    }
    if (INITIAL_JOIN_REQUESTS.length > 0) {
      await client
        .from('join_requests')
        .upsert(INITIAL_JOIN_REQUESTS.map(toJoinRequestRow));
    }
  },

  async seedLeagues(): Promise<void> {
    const client = getClient();
    await client.from('leagues').upsert(
      INITIAL_LEAGUES.map((league) => ({
        id: league.id,
        title: league.title,
        season: league.season,
        city: league.city,
        district: league.district,
        venue_name: league.venueName,
        format: league.format,
        status: league.status,
        max_teams: league.maxTeams,
        registered_teams_count: league.registeredTeamsCount,
        entry_fee: league.entryFee,
        prize: league.prize,
        organizer_name: league.organizerName,
        organizer_phone: league.organizerPhone,
        description: league.description,
        rules: league.rules,
        theme_color: league.themeColor,
        created_at: league.createdAt,
      }))
    );

    const allTeams = INITIAL_LEAGUES.flatMap((l) =>
      l.teams.map((t) => toLeagueTeamRow(l.id, t))
    );
    if (allTeams.length > 0) {
      await client.from('league_teams').upsert(allTeams);
    }

    const allFixtures = INITIAL_LEAGUES.flatMap((l) =>
      l.fixtures.map((f) => toLeagueFixtureRow(l.id, f))
    );
    if (allFixtures.length > 0) {
      await client.from('league_fixtures').upsert(allFixtures);
    }
  },

  async resetToDemoData(currentUserOverride?: User): Promise<{
    matches: Match[];
    gear: GearItem[];
    user: User;
    leagues: RegionalLeague[];
    evaluations: PlayerEvaluation[];
    joinRequests: JoinRequest[];
  }> {
    const client = getClient();
    await Promise.all([
      client.from('join_requests').delete().neq('id', ''),
      client.from('player_evaluations').delete().neq('id', ''),
      client.from('roster_slots').delete().neq('id', ''),
      client.from('league_fixtures').delete().neq('id', ''),
      client.from('league_teams').delete().neq('id', ''),
    ]);

    await Promise.all([
      client.from('matches').delete().neq('id', ''),
      client.from('leagues').delete().neq('id', ''),
      client.from('gear_items').delete().neq('id', ''),
    ]);

    const profileToKeep = currentUserOverride?.id ? currentUserOverride : INITIAL_USER;
    await client.from('profiles').upsert(toProfileRow(profileToKeep));
    await this.seedMatchesAndRequests();
    await this.seedLeagues();
    await client.from('gear_items').upsert(INITIAL_GEAR_ITEMS.map(toGearRow));
    await client
      .from('player_evaluations')
      .upsert(INITIAL_EVALUATIONS.map(toEvaluationRow));

    return {
      matches: INITIAL_MATCHES,
      gear: INITIAL_GEAR_ITEMS,
      user: profileToKeep,
      leagues: INITIAL_LEAGUES,
      evaluations: INITIAL_EVALUATIONS,
      joinRequests: INITIAL_JOIN_REQUESTS,
    };
  },
};

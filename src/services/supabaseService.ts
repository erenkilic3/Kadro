import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database, Json } from '../types/database';
import {
  AppNotification,
  CreateGearInput,
  CreateLeagueInput,
  CreateMatchInput,
  CreateTeamInput,
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
  MatchStatus,
  MatchupStats,
  NotificationEntityType,
  NotificationType,
  PlayerBadge,
  PlayerEvaluation,
  PlayerPosition,
  PredictionChoice,
  RegionalLeague,
  ReportInput,
  RosterSlot,
  SubmitEvaluationInput,
  SubmitVenueEvaluationInput,
  Team,
  TeamMember,
  UpdateGearInput,
  UpdateLeagueInput,
  UpdateMatchInput,
  User,
  Venue,
  VenueEvaluation,
} from '../types';
import { formatToTotalSlots } from '../utils/validators';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ContactRow = Database['public']['Tables']['profile_contacts']['Row'];
type MatchRow = Database['public']['Tables']['matches']['Row'];
type RosterSlotRow = Database['public']['Tables']['roster_slots']['Row'];
type VoteRow = Database['public']['Tables']['match_prediction_votes']['Row'];
type JoinRequestRow = Database['public']['Tables']['join_requests']['Row'];
type TeamRow = Database['public']['Tables']['teams']['Row'];
type TeamMemberRow = Database['public']['Tables']['team_members']['Row'];
type LeagueRow = Database['public']['Tables']['leagues']['Row'];
type LeagueTeamRow = Database['public']['Tables']['league_teams']['Row'];
type LeagueFixtureRow = Database['public']['Tables']['league_fixtures']['Row'];
type GearRow = Database['public']['Tables']['gear_items']['Row'];
type EvaluationRow = Database['public']['Tables']['evaluations']['Row'];
type VenueRow = Database['public']['Tables']['venues']['Row'];
type VenueEvaluationRow = Database['public']['Tables']['venue_evaluations']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export interface AuthUserSeed {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

function getClient() {
  if (!supabase) {
    throw new Error('Supabase istemcisi yapılandırılmamış. .env ayarlarını kontrol edin.');
  }
  return supabase;
}

function mapPosition(value: string | null | undefined): PlayerPosition {
  if (value === 'GK' || value === 'DEF' || value === 'MID' || value === 'FWD') {
    return value;
  }
  return 'MID';
}

function parseBadges(raw: Json | null | undefined): PlayerBadge[] {
  if (!Array.isArray(raw)) return [];
  const parsed: PlayerBadge[] = [];
  for (const item of raw) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const rec = item as Record<string, Json | undefined>;
      if (typeof rec.id === 'string' && typeof rec.label === 'string') {
        parsed.push({
          id: rec.id,
          label: rec.label,
          icon: typeof rec.icon === 'string' ? rec.icon : '',
          count: typeof rec.count === 'number' ? rec.count : 1,
        });
      }
    }
  }
  return parsed;
}

function mapProfile(row: ProfileRow, contact?: ContactRow | null): User {
  return {
    id: row.id,
    name: row.name,
    email: contact?.email || '',
    phone: contact?.phone || '',
    position: mapPosition(row.position),
    rating: Number(row.rating),
    fairPlayRating: Number(row.fair_play_rating),
    matchesPlayed: row.matches_played,
    preferredFoot:
      row.preferred_foot === 'Left' || row.preferred_foot === 'Both'
        ? row.preferred_foot
        : 'Right',
    city: row.city,
    district: row.district,
    avatarUrl: row.avatar_url || undefined,
    bio: row.bio || undefined,
    predictionScore: row.prediction_score,
    totalPredictions: row.total_predictions,
    correctPredictions: row.correct_predictions,
    evaluationsCount: row.evaluations_count,
    badges: parseBadges(row.badges),
    expoPushToken: contact?.expo_push_token || undefined,
    pushEnabled: contact?.push_enabled ?? true,
  };
}

function buildInitialRoster(
  matchId: string,
  format: MatchFormat,
  missingPositions: PlayerPosition[],
  organizer: User
): Database['public']['Tables']['roster_slots']['Insert'][] {
  const totalSlots = formatToTotalSlots(format);
  const half = totalSlots / 2;

  const team1Templates: Record<MatchFormat, PlayerPosition[]> = {
    '5v5': ['GK', 'DEF', 'DEF', 'MID', 'FWD'],
    '6v6': ['GK', 'DEF', 'DEF', 'MID', 'MID', 'FWD'],
    '7v7': ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'FWD'],
    '8v8': ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD'],
  };

  const template = team1Templates[format];
  const remainingMissing = [...missingPositions];

  // Reserve Team 1 slots requested as vacant first
  const slotIsVacant = new Array<boolean>(half).fill(false);
  for (let i = 0; i < half; i++) {
    const idx = remainingMissing.indexOf(template[i]);
    if (idx !== -1) {
      slotIsVacant[i] = true;
      remainingMissing.splice(idx, 1);
    }
  }

  // Pick a non-vacant slot for organizer (preferring organizer's own position, else any filled slot)
  let organizerIdx = template.findIndex(
    (pos, idx) => pos === organizer.position && !slotIsVacant[idx]
  );
  if (organizerIdx === -1) {
    organizerIdx = slotIsVacant.findIndex((vacant) => !vacant);
  }
  if (organizerIdx === -1) {
    // Organizer filled every position as missing; reserve last slot for organizer
    organizerIdx = half - 1;
    slotIsVacant[organizerIdx] = false;
  }

  const slots: Database['public']['Tables']['roster_slots']['Insert'][] = [];

  for (let i = 0; i < half; i++) {
    const isOrgSlot = i === organizerIdx;
    const vacant = slotIsVacant[i];
    slots.push({
      match_id: matchId,
      slot_order: i,
      team_side: 1,
      position: template[i],
      is_filled: isOrgSlot || !vacant,
      assigned_player_id: isOrgSlot ? organizer.id : null,
      assigned_player_name: isOrgSlot
        ? organizer.name
        : vacant
        ? null
        : 'Kaptan Kadrosu (Dolu)',
      assigned_player_rating: isOrgSlot ? organizer.rating : null,
      assigned_player_fair_play: isOrgSlot ? organizer.fairPlayRating ?? 4.9 : null,
      is_organizer: isOrgSlot,
    });
  }

  // Team 2 (opponent slots reserved as team block unless opened later)
  for (let i = 0; i < half; i++) {
    slots.push({
      match_id: matchId,
      slot_order: half + i,
      team_side: 2,
      position: template[i],
      is_filled: true,
      assigned_player_id: null,
      assigned_player_name: 'Rakip Takım',
      assigned_player_rating: null,
      assigned_player_fair_play: null,
      is_organizer: false,
    });
  }

  return slots;
}

function mapMatchRows(
  matchRows: MatchRow[],
  slotRows: RosterSlotRow[],
  voteRows: VoteRow[],
  currentUserId: string
): Match[] {
  const slotsByMatch = new Map<string, RosterSlotRow[]>();
  for (const s of slotRows) {
    const arr = slotsByMatch.get(s.match_id) || [];
    arr.push(s);
    slotsByMatch.set(s.match_id, arr);
  }

  const votesByMatch = new Map<string, VoteRow[]>();
  for (const v of voteRows) {
    const arr = votesByMatch.get(v.match_id) || [];
    arr.push(v);
    votesByMatch.set(v.match_id, arr);
  }

  return matchRows.map((row) => {
    const rawSlots = (slotsByMatch.get(row.id) || []).sort(
      (a, b) => a.slot_order - b.slot_order
    );

    const roster: RosterSlot[] = rawSlots.map((s) => ({
      id: s.id,
      position: mapPosition(s.position),
      teamSide: s.team_side === 2 ? 2 : 1,
      slotOrder: s.slot_order,
      isFilled: s.is_filled,
      isOrganizer: s.is_organizer,
      assignedPlayer:
        s.is_filled && s.assigned_player_name
          ? {
              id: s.assigned_player_id || '',
              name: s.assigned_player_name,
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

    const votes = votesByMatch.get(row.id) || [];
    const votesTeam1 = votes.filter((v) => v.choice === '1').length;
    const votesDraw = votes.filter((v) => v.choice === 'X').length;
    const votesTeam2 = votes.filter((v) => v.choice === '2').length;
    const myVoteRow = votes.find((v) => v.user_id === currentUserId);
    const userVote =
      myVoteRow?.choice === '1' || myVoteRow?.choice === 'X' || myVoteRow?.choice === '2'
        ? (myVoteRow.choice as PredictionChoice)
        : undefined;

    return {
      id: row.id,
      title: row.title,
      organizerId: row.organizer_id,
      organizerName: row.organizer_name,
      organizerPhone: row.organizer_phone || '',
      venueId: row.venue_id || undefined,
      venueName: row.venue_name,
      address: row.address,
      city: row.city,
      district: row.district,
      date: row.date_label,
      time: row.time_range,
      format: row.format as MatchFormat,
      pitchType: row.pitch_type as 'Açık Saha' | 'Kapalı Saha',
      feePerPlayer: row.fee_per_player,
      totalSlots: row.total_slots,
      roster,
      missingPositions: (row.missing_positions || []).map(mapPosition),
      notes: row.notes || undefined,
      status: row.status as MatchStatus,
      isJoined: roster.some(
        (slot) => slot.assignedPlayer?.id && slot.assignedPlayer.id === currentUserId
      ),
      isCompleted: row.is_completed,
      finalScore:
        row.final_score_team1 !== null && row.final_score_team2 !== null
          ? { team1: row.final_score_team1, team2: row.final_score_team2 }
          : undefined,
      createdAt: row.created_at,
      prediction: {
        team1Name: row.team1_name,
        team2Name: row.team2_name,
        votesTeam1,
        votesDraw,
        votesTeam2,
        userVote,
        category:
          row.prediction_category === 'Derbi' ||
          row.prediction_category === 'Haftanın Maçı'
            ? row.prediction_category
            : 'Normal',
      },
      matchupStats: (row.matchup_stats as unknown as MatchupStats) || undefined,
    };
  });
}

function mapGearRow(row: GearRow): GearItem {
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    sellerPhone: row.seller_phone || '',
    title: row.title,
    description: row.description,
    category: row.category as GearCategory,
    brand: row.brand,
    size: row.size,
    price: row.price,
    condition: row.condition as GearCondition,
    city: row.city,
    district: row.district,
    location: row.location,
    imageUrl: row.image_url || undefined,
    status: row.status === 'Sold' ? 'Sold' : 'Available',
    iconName: row.icon_name || undefined,
    createdAt: row.created_at,
  };
}

function mapNotificationRow(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    entityType: (row.entity_type as NotificationEntityType) || undefined,
    entityId: row.entity_id || undefined,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export const supabaseService = {
  async getUser(authSeed: AuthUserSeed): Promise<User> {
    const client = getClient();
    const [{ data: profile, error: profErr }, { data: contact, error: contactErr }] =
      await Promise.all([
        client.from('profiles').select('*').eq('id', authSeed.id).maybeSingle(),
        client
          .from('profile_contacts')
          .select('*')
          .eq('user_id', authSeed.id)
          .maybeSingle(),
      ]);

    if (profErr) throw profErr;
    if (contactErr) throw contactErr;

    if (!profile) {
      const meta = authSeed.user_metadata || {};
      const nameRaw =
        (typeof meta.name === 'string' && meta.name.trim()) ||
        (authSeed.email ? authSeed.email.split('@')[0] : '') ||
        'Yeni Oyuncu';
      const position = mapPosition(
        typeof meta.position === 'string' ? meta.position : 'MID'
      );
      const city =
        typeof meta.city === 'string' && meta.city.trim()
          ? meta.city.trim()
          : 'İstanbul';
      const district =
        typeof meta.district === 'string' && meta.district.trim()
          ? meta.district.trim()
          : 'Kadıköy';

      const { data: inserted, error: insertErr } = await client
        .from('profiles')
        .upsert({
          id: authSeed.id,
          name: nameRaw.length >= 2 ? nameRaw : 'Yeni Oyuncu',
          position,
          city,
          district,
        })
        .select('*')
        .single();

      if (insertErr) throw insertErr;

      const { data: insertedContact } = await client
        .from('profile_contacts')
        .upsert({
          user_id: authSeed.id,
          email: authSeed.email || null,
        })
        .select('*')
        .maybeSingle();

      return mapProfile(inserted, insertedContact);
    }

    return mapProfile(profile, contact);
  },

  async saveUser(user: User, updates?: Partial<User>): Promise<void> {
    const client = getClient();
    const merged = { ...user, ...updates };

    const { error: profErr } = await client
      .from('profiles')
      .update({
        name: merged.name.trim(),
        position: merged.position,
        preferred_foot: merged.preferredFoot,
        city: merged.city.trim() || 'İstanbul',
        district: merged.district.trim() || 'Kadıköy',
        avatar_url: merged.avatarUrl || null,
        bio: merged.bio?.trim() || null,
      })
      .eq('id', merged.id);

    if (profErr) throw profErr;

    if (
      updates &&
      ('phone' in updates ||
        'email' in updates ||
        'expoPushToken' in updates ||
        'pushEnabled' in updates)
    ) {
      const { error: contactErr } = await client.from('profile_contacts').upsert({
        user_id: merged.id,
        email: merged.email || null,
        phone: merged.phone?.trim() || null,
        expo_push_token: merged.expoPushToken || null,
        push_enabled: merged.pushEnabled ?? true,
      });
      if (contactErr) throw contactErr;
    }
  },

  async searchProfiles(query: string): Promise<User[]> {
    const client = getClient();
    const trimmed = query.trim();
    let req = client
      .from('profiles')
      .select('*')
      .order('rating', { ascending: false })
      .limit(20);

    if (trimmed) {
      req = req.ilike('name', `%${trimmed}%`);
    }

    const { data, error } = await req;
    if (error) throw error;
    return (data || []).map((row) => mapProfile(row));
  },

  async getMatches(currentUserId: string): Promise<Match[]> {
    const client = getClient();
    const [
      { data: matchRows, error: matchErr },
      { data: slotRows, error: slotErr },
      { data: voteRows, error: voteErr },
    ] = await Promise.all([
      client.from('matches').select('*').order('created_at', { ascending: false }),
      client.from('roster_slots').select('*').order('slot_order', { ascending: true }),
      client.from('match_prediction_votes').select('*'),
    ]);

    if (matchErr) throw matchErr;
    if (slotErr) throw slotErr;
    if (voteErr) throw voteErr;

    return mapMatchRows(matchRows || [], slotRows || [], voteRows || [], currentUserId);
  },

  async createMatch(input: CreateMatchInput, organizer: User): Promise<string> {
    const client = getClient();
    const totalSlots = formatToTotalSlots(input.format);

    const { data: created, error: matchErr } = await client
      .from('matches')
      .insert({
        title: input.title.trim(),
        organizer_id: organizer.id,
        organizer_name: organizer.name,
        organizer_phone: organizer.phone || null,
        venue_name: input.venueName.trim(),
        address: input.address.trim(),
        city: (input.city || organizer.city || 'İstanbul').trim(),
        district: input.district.trim(),
        date_label: input.date.trim(),
        time_range: input.time.trim(),
        format: input.format,
        pitch_type: input.pitchType,
        fee_per_player: Math.round(input.feePerPlayer),
        total_slots: totalSlots,
        missing_positions: input.missingPositions,
        team1_name: `${organizer.name.split(' ')[0] || 'Kadro'} & Ekibi`,
        team2_name: 'Rakip Takım',
        prediction_category: 'Normal',
        notes: input.notes?.trim() || null,
        status: 'OPEN',
      })
      .select('id')
      .single();

    if (matchErr) throw matchErr;

    const slots = buildInitialRoster(
      created.id,
      input.format,
      input.missingPositions,
      organizer
    );
    const { error: slotErr } = await client.from('roster_slots').insert(slots);
    if (slotErr) {
      await client.from('matches').delete().eq('id', created.id);
      throw slotErr;
    }

    return created.id;
  },

  async updateMatch(matchId: string, updates: UpdateMatchInput): Promise<void> {
    const client = getClient();
    const payload: Database['public']['Tables']['matches']['Update'] = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.venueName !== undefined) payload.venue_name = updates.venueName.trim();
    if (updates.address !== undefined) payload.address = updates.address.trim();
    if (updates.city !== undefined) payload.city = updates.city.trim();
    if (updates.district !== undefined) payload.district = updates.district.trim();
    if (updates.date !== undefined) payload.date_label = updates.date.trim();
    if (updates.time !== undefined) payload.time_range = updates.time.trim();
    if (updates.pitchType !== undefined) payload.pitch_type = updates.pitchType;
    if (updates.feePerPlayer !== undefined) {
      payload.fee_per_player = Math.round(updates.feePerPlayer);
    }
    if (updates.notes !== undefined) payload.notes = updates.notes.trim() || null;
    if (updates.status !== undefined) payload.status = updates.status;

    const { error } = await client.from('matches').update(payload).eq('id', matchId);
    if (error) throw error;
  },

  async deleteMatch(matchId: string): Promise<void> {
    const client = getClient();
    const { error } = await client.from('matches').delete().eq('id', matchId);
    if (error) throw error;
  },

  async completeMatch(matchId: string, score1: number, score2: number): Promise<boolean> {
    const client = getClient();
    const { data, error } = await client.rpc('complete_match_atomic', {
      p_match_id: matchId,
      p_score_team1: score1,
      p_score_team2: score2,
    });
    if (error) throw error;
    return Boolean(data);
  },

  async joinMatchSlotAtomic(matchId: string, slotId: string): Promise<boolean> {
    const client = getClient();
    const { data, error } = await client.rpc('join_match_slot_atomic', {
      p_match_id: matchId,
      p_slot_id: slotId,
    });
    if (error) throw error;
    return Boolean(data);
  },

  async leaveMatchAtomic(matchId: string): Promise<boolean> {
    const client = getClient();
    const { data, error } = await client.rpc('leave_match_atomic', {
      p_match_id: matchId,
    });
    if (error) throw error;
    return Boolean(data);
  },

  async castPredictionVote(matchId: string, choice: PredictionChoice): Promise<boolean> {
    const client = getClient();
    const { data, error } = await client.rpc('cast_match_prediction_vote', {
      p_match_id: matchId,
      p_choice: choice,
    });
    if (error) throw error;
    return Boolean(data);
  },

  async getJoinRequests(): Promise<JoinRequest[]> {
    const client = getClient();
    const { data, error } = await client
      .from('join_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: JoinRequestRow) => ({
      id: row.id,
      matchId: row.match_id,
      slotId: row.slot_id,
      position: mapPosition(row.position),
      requesterId: row.requester_id,
      requesterName: row.requester_name,
      requesterRating: Number(row.requester_rating),
      requesterFairPlay: Number(row.requester_fair_play),
      message: row.message || undefined,
      status: row.status as JoinRequestStatus,
      createdAt: row.created_at,
      respondedAt: row.responded_at || undefined,
    }));
  },

  async createJoinRequest(params: {
    matchId: string;
    slotId: string;
    position: PlayerPosition;
    requester: User;
    message?: string;
  }): Promise<void> {
    const client = getClient();
    const { error } = await client.from('join_requests').insert({
      match_id: params.matchId,
      slot_id: params.slotId,
      position: params.position,
      requester_id: params.requester.id,
      requester_name: params.requester.name,
      requester_rating: params.requester.rating,
      requester_fair_play: params.requester.fairPlayRating ?? 4.9,
      message: params.message?.trim() || null,
      status: 'PENDING',
    });
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

  async rejectJoinRequest(requestId: string): Promise<boolean> {
    const client = getClient();
    const { data, error } = await client.rpc('reject_join_request', {
      p_request_id: requestId,
    });
    if (error) throw error;
    return Boolean(data);
  },

  async getTeams(): Promise<Team[]> {
    const client = getClient();
    const [{ data: teamRows, error: tErr }, { data: memberRows, error: mErr }] =
      await Promise.all([
        client.from('teams').select('*').order('created_at', { ascending: false }),
        client.from('team_members').select('*'),
      ]);

    if (tErr) throw tErr;
    if (mErr) throw mErr;

    const playerIds = Array.from(
      new Set((memberRows || []).map((m) => m.player_id))
    );
    const profilesMap = new Map<string, ProfileRow>();
    if (playerIds.length > 0) {
      const { data: profRows } = await client
        .from('profiles')
        .select('*')
        .in('id', playerIds);
      for (const p of profRows || []) {
        profilesMap.set(p.id, p);
      }
    }

    const membersByTeam = new Map<string, TeamMember[]>();
    for (const m of (memberRows || []) as TeamMemberRow[]) {
      const prof = profilesMap.get(m.player_id);
      const arr = membersByTeam.get(m.team_id) || [];
      arr.push({
        id: m.id,
        teamId: m.team_id,
        playerId: m.player_id,
        playerName: prof?.name || 'Oyuncu',
        playerPosition: prof ? mapPosition(prof.position) : undefined,
        playerRating: prof ? Number(prof.rating) : undefined,
        role: m.role === 'CAPTAIN' ? 'CAPTAIN' : 'PLAYER',
        joinedAt: m.joined_at,
      });
      membersByTeam.set(m.team_id, arr);
    }

    return (teamRows || []).map((t: TeamRow) => ({
      id: t.id,
      name: t.name,
      logoEmoji: t.logo_emoji,
      captainId: t.captain_id,
      city: t.city,
      district: t.district,
      format: t.format as MatchFormat,
      bio: t.bio || undefined,
      members: membersByTeam.get(t.id) || [],
      createdAt: t.created_at,
    }));
  },

  async createTeam(input: CreateTeamInput, captain: User): Promise<string> {
    const client = getClient();
    const { data, error } = await client
      .from('teams')
      .insert({
        name: input.name.trim(),
        logo_emoji: input.logoEmoji || '⚽',
        captain_id: captain.id,
        city: input.city.trim(),
        district: input.district.trim(),
        format: input.format,
        bio: input.bio?.trim() || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    const { error: memErr } = await client.from('team_members').insert({
      team_id: data.id,
      player_id: captain.id,
      role: 'CAPTAIN',
    });
    if (memErr) throw memErr;

    return data.id;
  },

  async addTeamMember(teamId: string, playerId: string): Promise<void> {
    const client = getClient();
    const { error } = await client.from('team_members').insert({
      team_id: teamId,
      player_id: playerId,
      role: 'PLAYER',
    });
    if (error) throw error;
  },

  async removeTeamMember(teamId: string, playerId: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('player_id', playerId);
    if (error) throw error;
  },

  async transferTeamCaptain(teamId: string, newCaptainId: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('teams')
      .update({ captain_id: newCaptainId })
      .eq('id', teamId);
    if (error) throw error;
  },

  async getLeagues(): Promise<RegionalLeague[]> {
    const client = getClient();
    const [
      { data: leagueRows, error: leagueErr },
      { data: teamRows, error: teamErr },
      { data: fixRows, error: fixErr },
    ] = await Promise.all([
      client.from('leagues').select('*').order('created_at', { ascending: false }),
      client.from('league_teams').select('*').order('points', { ascending: false }),
      client
        .from('league_fixtures')
        .select('*')
        .order('week', { ascending: true }),
    ]);

    if (leagueErr) throw leagueErr;
    if (teamErr) throw teamErr;
    if (fixErr) throw fixErr;

    const teamsByLeague = new Map<string, LeagueTeam[]>();
    for (const row of (teamRows || []) as LeagueTeamRow[]) {
      const list = teamsByLeague.get(row.league_id) || [];
      list.push({
        id: row.id,
        teamId: row.team_id || undefined,
        captainId: row.captain_id || undefined,
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
        form: (row.form || []).filter(
          (f): f is 'W' | 'D' | 'L' => f === 'W' || f === 'D' || f === 'L'
        ),
      });
      teamsByLeague.set(row.league_id, list);
    }

    const fixturesByLeague = new Map<string, LeagueFixture[]>();
    for (const row of (fixRows || []) as LeagueFixtureRow[]) {
      const list = fixturesByLeague.get(row.league_id) || [];
      list.push({
        id: row.id,
        week: row.week,
        homeTeamId: row.home_league_team_id || undefined,
        awayTeamId: row.away_league_team_id || undefined,
        homeTeamName: row.home_team_name,
        awayTeamName: row.away_team_name,
        homeScore: row.home_score ?? undefined,
        awayScore: row.away_score ?? undefined,
        date: row.date_label,
        time: row.time_label,
        venue: row.venue,
        isFinished: row.is_finished,
      });
      fixturesByLeague.set(row.league_id, list);
    }

    return (leagueRows || []).map((l: LeagueRow) => ({
      id: l.id,
      title: l.title,
      season: l.season,
      city: l.city,
      district: l.district,
      venueName: l.venue_name,
      format: l.format as MatchFormat,
      status: l.status as LeagueStatus,
      maxTeams: l.max_teams,
      registeredTeamsCount: l.registered_teams_count,
      entryFee: l.entry_fee,
      prize: l.prize,
      organizerId: l.organizer_id,
      organizerName: l.organizer_name,
      organizerPhone: l.organizer_phone || '',
      description: l.description,
      rules: l.rules || [],
      themeColor: l.theme_color,
      createdAt: l.created_at,
      teams: teamsByLeague.get(l.id) || [],
      fixtures: fixturesByLeague.get(l.id) || [],
    }));
  },

  async createLeague(
    input: CreateLeagueInput,
    organizer: User,
    hostTeamName?: string
  ): Promise<string> {
    const client = getClient();
    const { data, error } = await client
      .from('leagues')
      .insert({
        title: input.title.trim(),
        season: input.season.trim(),
        city: input.city.trim() || 'İstanbul',
        district: input.district.trim(),
        venue_name: input.venueName.trim(),
        format: input.format,
        status: 'REGISTRATION_OPEN',
        max_teams: input.maxTeams,
        registered_teams_count: 0,
        entry_fee: Math.round(input.entryFee),
        prize: input.prize.trim(),
        organizer_id: organizer.id,
        organizer_name: organizer.name,
        organizer_phone: organizer.phone || null,
        description: input.description.trim(),
        rules: input.rules,
        theme_color: input.themeColor || '#16A34A',
      })
      .select('id')
      .single();

    if (error) throw error;

    const defaultHostName =
      hostTeamName?.trim() || `${organizer.name.split(' ')[0] || 'Kadıköy'} Spor`;

    await client.rpc('register_team_to_league', {
      p_league_id: data.id,
      p_team_name: defaultHostName,
      p_captain_name: organizer.name,
      p_captain_phone: organizer.phone || undefined,
    });

    return data.id;
  },

  async updateLeague(leagueId: string, updates: UpdateLeagueInput): Promise<void> {
    const client = getClient();
    const payload: Database['public']['Tables']['leagues']['Update'] = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.season !== undefined) payload.season = updates.season.trim();
    if (updates.city !== undefined) payload.city = updates.city.trim();
    if (updates.district !== undefined) payload.district = updates.district.trim();
    if (updates.venueName !== undefined) payload.venue_name = updates.venueName.trim();
    if (updates.entryFee !== undefined) payload.entry_fee = Math.round(updates.entryFee);
    if (updates.prize !== undefined) payload.prize = updates.prize.trim();
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.rules !== undefined) payload.rules = updates.rules;
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.themeColor !== undefined) payload.theme_color = updates.themeColor;

    const { error } = await client.from('leagues').update(payload).eq('id', leagueId);
    if (error) throw error;
  },

  async deleteLeague(leagueId: string): Promise<void> {
    const client = getClient();
    const { error } = await client.from('leagues').delete().eq('id', leagueId);
    if (error) throw error;
  },

  async registerTeamToLeague(params: {
    leagueId: string;
    teamName: string;
    captainName: string;
    captainPhone?: string;
    teamId?: string;
  }): Promise<string> {
    const client = getClient();
    const { data, error } = await client.rpc('register_team_to_league', {
      p_league_id: params.leagueId,
      p_team_name: params.teamName.trim(),
      p_captain_name: params.captainName.trim(),
      p_captain_phone: params.captainPhone?.trim() || undefined,
      p_team_id: params.teamId,
    });
    if (error) throw error;
    return data;
  },

  async generateLeagueRoundRobinFixtures(league: RegionalLeague): Promise<void> {
    const client = getClient();
    if (league.teams.length < 2) {
      throw new Error('Fikstür oluşturmak için en az 2 takım kayıtlı olmalıdır.');
    }

    const teams = [...league.teams];
    const inserts: Database['public']['Tables']['league_fixtures']['Insert'][] = [];
    let week =
      league.fixtures.length > 0
        ? Math.max(...league.fixtures.map((f) => f.week)) + 1
        : 1;

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        inserts.push({
          league_id: league.id,
          week,
          home_league_team_id: teams[i].id,
          away_league_team_id: teams[j].id,
          home_team_name: teams[i].name,
          away_team_name: teams[j].name,
          date_label: `Hafta ${week}`,
          time_label: '21:00',
          venue: league.venueName,
          is_finished: false,
        });
        if (inserts.length % Math.max(1, Math.floor(teams.length / 2)) === 0) {
          week += 1;
        }
      }
    }

    const { error } = await client.from('league_fixtures').insert(inserts);
    if (error) throw error;
  },

  async recordLeagueFixtureResult(
    fixtureId: string,
    homeScore: number,
    awayScore: number
  ): Promise<boolean> {
    const client = getClient();
    const { data, error } = await client.rpc('record_league_fixture_result', {
      p_fixture_id: fixtureId,
      p_home_score: homeScore,
      p_away_score: awayScore,
    });
    if (error) throw error;
    return Boolean(data);
  },

  async getGearItems(): Promise<GearItem[]> {
    const client = getClient();
    const { data, error } = await client
      .from('gear_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapGearRow);
  },

  async createGearItem(input: CreateGearInput, seller: User): Promise<string> {
    const client = getClient();
    const locParts = input.location.split('/').map((s) => s.trim());
    const city = input.city || locParts[0] || seller.city || 'İstanbul';
    const district = input.district || locParts[1] || seller.district || 'Kadıköy';

    const { data, error } = await client
      .from('gear_items')
      .insert({
        seller_id: seller.id,
        seller_name: seller.name,
        seller_phone: seller.phone || null,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        brand: input.brand.trim(),
        size: input.size.trim(),
        price: Math.round(input.price),
        condition: input.condition,
        city,
        district,
        location: input.location.trim() || `${city} / ${district}`,
        image_url: input.imageUrl || null,
        status: 'Available',
        icon_name:
          input.category === 'Boots'
            ? 'football'
            : input.category === 'Jerseys'
            ? 'shirt'
            : input.category === 'Gloves'
            ? 'hand-left'
            : 'shield',
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async updateGearItem(gearId: string, updates: UpdateGearInput): Promise<void> {
    const client = getClient();
    const payload: Database['public']['Tables']['gear_items']['Update'] = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.brand !== undefined) payload.brand = updates.brand.trim();
    if (updates.size !== undefined) payload.size = updates.size.trim();
    if (updates.price !== undefined) payload.price = Math.round(updates.price);
    if (updates.condition !== undefined) payload.condition = updates.condition;
    if (updates.city !== undefined) payload.city = updates.city.trim();
    if (updates.district !== undefined) payload.district = updates.district.trim();
    if (updates.location !== undefined) payload.location = updates.location.trim();
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl || null;

    const { error } = await client.from('gear_items').update(payload).eq('id', gearId);
    if (error) throw error;
  },

  async deleteGearItem(gearId: string): Promise<void> {
    const client = getClient();
    const { error } = await client.from('gear_items').delete().eq('id', gearId);
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

  async getEvaluations(): Promise<PlayerEvaluation[]> {
    const client = getClient();
    const { data, error } = await client
      .from('evaluations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: EvaluationRow) => ({
      id: row.id,
      matchId: row.match_id,
      matchTitle: row.match_title,
      evaluatorId: row.evaluator_id,
      evaluatorName: row.evaluator_name,
      targetPlayerId: row.target_player_id,
      targetPlayerName: row.target_player_name,
      targetPlayerPosition: row.target_player_position
        ? mapPosition(row.target_player_position)
        : undefined,
      isOpponent: row.is_opponent,
      skillRating: row.skill_rating,
      fairPlayRating: row.fair_play_rating,
      badges: row.badges || [],
      comment: row.comment || undefined,
      createdAt: row.created_at,
    }));
  },

  async createEvaluation(input: SubmitEvaluationInput, evaluator: User): Promise<void> {
    const client = getClient();
    const { error } = await client.from('evaluations').insert({
      match_id: input.matchId,
      match_title: input.matchTitle,
      evaluator_id: evaluator.id,
      evaluator_name: evaluator.name,
      target_player_id: input.targetPlayerId,
      target_player_name: input.targetPlayerName,
      target_player_position: input.targetPlayerPosition || null,
      is_opponent: input.isOpponent,
      skill_rating: input.skillRating,
      fair_play_rating: input.fairPlayRating,
      badges: input.badges,
      comment: input.comment?.trim() || null,
    });
    if (error) throw error;
  },

  async getVenues(): Promise<Venue[]> {
    const client = getClient();
    const { data, error } = await client
      .from('venues')
      .select('*')
      .order('overall_rating', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: VenueRow) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      district: row.district,
      address: row.address || undefined,
      pitchType: row.pitch_type === 'Kapalı Saha' ? 'Kapalı Saha' : 'Açık Saha',
      overallRating: Number(row.overall_rating),
      turfRating: Number(row.turf_rating),
      lightingRating: Number(row.lighting_rating),
      lockerRoomRating: Number(row.locker_room_rating),
      organizationRating: Number(row.organization_rating),
      evaluationsCount: row.evaluations_count,
      amenities: row.amenities || [],
      createdAt: row.created_at,
    }));
  },

  async getVenueEvaluations(): Promise<VenueEvaluation[]> {
    const client = getClient();
    const { data, error } = await client
      .from('venue_evaluations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: VenueEvaluationRow) => ({
      id: row.id,
      venueId: row.venue_id,
      matchId: row.match_id,
      evaluatorId: row.evaluator_id,
      evaluatorName: row.evaluator_name,
      overallRating: Number(row.overall_rating),
      turfRating: row.turf_rating,
      lightingRating: row.lighting_rating,
      lockerRoomRating: row.locker_room_rating,
      organizationRating: row.organization_rating,
      highlights: row.highlights || [],
      comment: row.comment || undefined,
      createdAt: row.created_at,
    }));
  },

  async createVenueEvaluation(
    input: SubmitVenueEvaluationInput,
    evaluator: User
  ): Promise<void> {
    const client = getClient();
    const overallRating = Number(
      (
        (input.turfRating +
          input.lightingRating +
          input.lockerRoomRating +
          input.organizationRating) /
        4
      ).toFixed(2)
    );

    const { error } = await client.from('venue_evaluations').insert({
      venue_id: input.venueId || '00000000-0000-0000-0000-000000000000',
      match_id: input.matchId,
      evaluator_id: evaluator.id,
      evaluator_name: evaluator.name,
      overall_rating: overallRating,
      turf_rating: input.turfRating,
      lighting_rating: input.lightingRating,
      locker_room_rating: input.lockerRoomRating,
      organization_rating: input.organizationRating,
      highlights: input.highlights,
      comment: input.comment?.trim() || null,
    });
    if (error) throw error;
  },

  async deleteVenueEvaluation(evaluationId: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('venue_evaluations')
      .delete()
      .eq('id', evaluationId);
    if (error) throw error;
  },

  async getNotifications(userId: string): Promise<AppNotification[]> {
    const client = getClient();
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data || []).map(mapNotificationRow);
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },

  async submitReport(reporterId: string, input: ReportInput): Promise<void> {
    const client = getClient();
    const { error } = await client.from('reports').insert({
      reporter_id: reporterId,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason.trim(),
      details: input.details?.trim() || null,
    });
    if (error) throw error;
  },

  subscribeToNotifications(
    userId: string,
    onInsert: (notification: AppNotification) => void
  ): RealtimeChannel | null {
    if (!supabase) return null;
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            onInsert(mapNotificationRow(payload.new as NotificationRow));
          }
        }
      )
      .subscribe();
  },

  subscribeToMatchChanges(onChange: () => void): RealtimeChannel | null {
    if (!supabase) return null;
    return supabase
      .channel('kadro:live-matches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        onChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'roster_slots' },
        onChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'join_requests' },
        onChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'venues' },
        onChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'venue_evaluations' },
        onChange
      )
      .subscribe();
  },
};

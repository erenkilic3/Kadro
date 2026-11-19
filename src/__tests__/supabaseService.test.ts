import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { supabaseService } from '../services/supabaseService';
import { User } from '../types';

const mockRpc = jest.fn<(...args: any[]) => Promise<any>>();
const mockFrom = jest.fn<(table: string) => any>();

jest.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
    from: (table: string) => mockFrom(table),
  },
}));

function createQueryChain(result: { data?: any; error?: any } = { data: [], error: null }) {
  const chain: any = {
    select: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    upsert: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    ilike: jest.fn(() => chain),
    in: jest.fn(() => chain),
    order: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    single: jest.fn(async () => result),
    maybeSingle: jest.fn(async () => result),
    then: (onFulfilled: (val: any) => any, onRejected?: (err: any) => any) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return chain;
}

const organizer: User = {
  id: 'user-1',
  name: 'Eren Kılıç',
  email: 'eren@kadro.app',
  phone: '05550001122',
  position: 'MID',
  rating: 4.8,
  fairPlayRating: 4.9,
  matchesPlayed: 12,
  preferredFoot: 'Right',
  city: 'İstanbul',
  district: 'Kadıköy',
};

describe('supabaseService atomic RPCs & CRUD', () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockFrom.mockReset();
  });

  it('calls complete_match_atomic RPC and returns boolean result', async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null });
    const ok = await supabaseService.completeMatch('match-uuid', 4, 2);
    expect(ok).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('complete_match_atomic', {
      p_match_id: 'match-uuid',
      p_score_team1: 4,
      p_score_team2: 2,
    });
  });

  it('calls atomic match slot join, leave, approve, and reject RPCs', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });

    expect(await supabaseService.joinMatchSlotAtomic('m-1', 's-1')).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('join_match_slot_atomic', {
      p_match_id: 'm-1',
      p_slot_id: 's-1',
    });

    expect(await supabaseService.leaveMatchAtomic('m-1')).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('leave_match_atomic', { p_match_id: 'm-1' });

    expect(await supabaseService.approveJoinRequest('req-1')).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('approve_join_request', { p_request_id: 'req-1' });

    expect(await supabaseService.rejectJoinRequest('req-2')).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('reject_join_request', { p_request_id: 'req-2' });
  });

  it('creates a match and rolls back match insert if roster_slots insertion fails', async () => {
    const matchInsertChain = createQueryChain({ data: { id: 'new-match-1' }, error: null });
    const slotFailChain = createQueryChain({ data: null, error: new Error('slot fail') });
    const rollbackDeleteChain = createQueryChain({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(matchInsertChain)
      .mockReturnValueOnce(slotFailChain)
      .mockReturnValueOnce(rollbackDeleteChain);

    await expect(
      supabaseService.createMatch(
        {
          title: 'Gece 6v6',
          venueName: 'Moda Saha',
          address: 'Kadıköy, İstanbul',
          district: 'Kadıköy',
          date: '2026-11-25',
          time: '21:00 - 22:00',
          format: '6v6',
          pitchType: 'Açık Saha',
          feePerPlayer: 200,
          missingPositions: ['GK'],
        },
        organizer
      )
    ).rejects.toThrow('slot fail');

    expect(mockFrom).toHaveBeenNthCalledWith(1, 'matches');
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'roster_slots');
    expect(mockFrom).toHaveBeenNthCalledWith(3, 'matches');
    expect(rollbackDeleteChain.delete).toHaveBeenCalled();
  });

  it('registers teams and records league fixture scores via RPCs', async () => {
    mockRpc.mockResolvedValueOnce({ data: 'lt-1', error: null });
    const teamRowId = await supabaseService.registerTeamToLeague({
      leagueId: 'l-1',
      teamName: 'Moda FK',
      captainName: 'Eren Kılıç',
      captainPhone: '0555',
      teamId: 't-1',
    });
    expect(teamRowId).toBe('lt-1');
    expect(mockRpc).toHaveBeenCalledWith('register_team_to_league', {
      p_league_id: 'l-1',
      p_team_name: 'Moda FK',
      p_captain_name: 'Eren Kılıç',
      p_captain_phone: '0555',
      p_team_id: 't-1',
    });

    mockRpc.mockResolvedValueOnce({ data: true, error: null });
    const scored = await supabaseService.recordLeagueFixtureResult('f-1', 2, 1);
    expect(scored).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('record_league_fixture_result', {
      p_fixture_id: 'f-1',
      p_home_score: 2,
      p_away_score: 1,
    });
  });

  it('propagates evaluation trigger errors cleanly', async () => {
    const evalErrChain = createQueryChain({
      data: null,
      error: new Error('Sadece tamamlanan maçlar için değerlendirme yapılabilir.'),
    });
    mockFrom.mockReturnValueOnce(evalErrChain);

    await expect(
      supabaseService.createEvaluation(
        {
          matchId: 'm-1',
          matchTitle: 'Derbi',
          targetPlayerId: 'user-2',
          targetPlayerName: 'Can',
          isOpponent: false,
          skillRating: 5,
          fairPlayRating: 5,
          badges: [],
        },
        organizer
      )
    ).rejects.toThrow('Sadece tamamlanan maçlar için değerlendirme yapılabilir.');
  });

  it('marks gear sold, marks all notifications read, and submits reports', async () => {
    const gearChain = createQueryChain({ data: null, error: null });
    const notifChain = createQueryChain({ data: null, error: null });
    const reportChain = createQueryChain({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(gearChain)
      .mockReturnValueOnce(notifChain)
      .mockReturnValueOnce(reportChain);

    await supabaseService.markGearSold('g-1');
    expect(gearChain.update).toHaveBeenCalledWith({ status: 'Sold' });

    await supabaseService.markAllNotificationsRead('user-1');
    expect(notifChain.update).toHaveBeenCalledWith({ is_read: true });
    expect(notifChain.eq).toHaveBeenCalledWith('user_id', 'user-1');

    await supabaseService.submitReport('user-1', {
      targetType: 'GEAR',
      targetId: 'g-1',
      reason: 'Hatalı fiyat',
      details: 'İlan tutarsız',
    });
    expect(reportChain.insert).toHaveBeenCalledWith({
      reporter_id: 'user-1',
      target_type: 'GEAR',
      target_id: 'g-1',
      reason: 'Hatalı fiyat',
      details: 'İlan tutarsız',
    });
  });

  it('creates and deletes venue evaluations and maps venues cleanly', async () => {
    const venuesQuery = createQueryChain({
      data: [
        {
          id: 'venue-1',
          name: 'Kalamış Halı Saha',
          city: 'İstanbul',
          district: 'Kadıköy',
          address: 'Kalamış Cd.',
          pitch_type: 'Açık Saha',
          overall_rating: 4.5,
          turf_rating: 5,
          lighting_rating: 4,
          locker_room_rating: 4,
          organization_rating: 5,
          evaluations_count: 3,
          amenities: ['Yeni Suni Çim'],
          created_at: '2026-11-19T08:00:00Z',
          updated_at: '2026-11-19T08:00:00Z',
        },
      ],
      error: null,
    });
    const insertVenueEval = createQueryChain({ data: null, error: null });
    const deleteVenueEval = createQueryChain({ data: null, error: null });

    mockFrom
      .mockReturnValueOnce(venuesQuery)
      .mockReturnValueOnce(insertVenueEval)
      .mockReturnValueOnce(deleteVenueEval);

    const venues = await supabaseService.getVenues();
    expect(venues).toHaveLength(1);
    expect(venues[0].overallRating).toBe(4.5);
    expect(venues[0].evaluationsCount).toBe(3);

    await supabaseService.createVenueEvaluation(
      {
        matchId: 'match-1',
        venueId: 'venue-1',
        turfRating: 5,
        lightingRating: 4,
        lockerRoomRating: 4,
        organizationRating: 5,
        highlights: ['Yeni Suni Çim'],
        comment: 'Harika saha',
      },
      organizer
    );
    expect(insertVenueEval.insert).toHaveBeenCalledWith({
      venue_id: 'venue-1',
      match_id: 'match-1',
      evaluator_id: 'user-1',
      evaluator_name: 'Eren Kılıç',
      overall_rating: 4.5,
      turf_rating: 5,
      lighting_rating: 4,
      locker_room_rating: 4,
      organization_rating: 5,
      highlights: ['Yeni Suni Çim'],
      comment: 'Harika saha',
    });

    await supabaseService.deleteVenueEvaluation('ve-1');
    expect(deleteVenueEval.delete).toHaveBeenCalled();
    expect(deleteVenueEval.eq).toHaveBeenCalledWith('id', 've-1');
  });
});

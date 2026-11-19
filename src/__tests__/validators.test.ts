import { describe, expect, it } from '@jest/globals';
import {
  formatToTotalSlots,
  validateEmail,
  validateEvaluationInput,
  validateGearInput,
  validateLeagueInput,
  validateMatchInput,
  validateMatchScores,
  validatePassword,
  validateProfileInput,
  validateReportReason,
  validateTeamName,
  validateVenueEvaluationInput,
} from '../utils/validators';

describe('validators', () => {
  it('maps match format to correct total player slots', () => {
    expect(formatToTotalSlots('5v5')).toBe(10);
    expect(formatToTotalSlots('6v6')).toBe(12);
    expect(formatToTotalSlots('7v7')).toBe(14);
    expect(formatToTotalSlots('8v8')).toBe(16);
  });

  it('validates email, password, and profile fields', () => {
    expect(validateEmail('oyuncu@kadro.app').valid).toBe(true);
    expect(validateEmail('gecersiz-eposta').valid).toBe(false);
    expect(validatePassword('12345').valid).toBe(false);
    expect(validatePassword('kadro123').valid).toBe(true);
    expect(validateProfileInput('E', 'MID').valid).toBe(false);
    expect(validateProfileInput('Eren Kılıç', 'MID').valid).toBe(true);
  });

  it('validates match creation input and score limits', () => {
    const validMatch = {
      title: 'Kadıköy 7v7 Gece Maçı',
      venueName: 'Kalamış Halı Saha',
      district: 'Kadıköy',
      city: 'İstanbul',
      date: '2026-11-20',
      time: '21:00 - 22:00',
      format: '7v7' as const,
      feePerPlayer: 220,
      missingPositions: ['GK', 'DEF'] as ('GK' | 'DEF')[],
    };

    expect(validateMatchInput(validMatch).valid).toBe(true);
    expect(validateMatchInput({ ...validMatch, title: 'Ma' }).valid).toBe(false);
    expect(validateMatchInput({ ...validMatch, venueName: '' }).valid).toBe(false);
    expect(validateMatchInput({ ...validMatch, feePerPlayer: -10 }).valid).toBe(false);
    expect(validateMatchInput({ ...validMatch, missingPositions: [] }).valid).toBe(false);

    expect(validateMatchScores(3, 2).valid).toBe(true);
    expect(validateMatchScores(0, 0).valid).toBe(true);
    expect(validateMatchScores(-1, 2).valid).toBe(false);
    expect(validateMatchScores(1.5, 2).valid).toBe(false);
  });

  it('validates league and team registration inputs', () => {
    const validLeague = {
      title: 'Kadıköy Halı Saha Ligi',
      season: '2026 Kış',
      city: 'İstanbul',
      district: 'Kadıköy',
      venueName: 'Moda Arena',
      format: '7v7' as const,
      maxTeams: 8,
      entryFee: 1200,
      prize: '15.000₺ Kupa',
      rules: ['Fair-Play'],
      description: 'Bölgesel turnuva',
    };

    expect(validateLeagueInput(validLeague).valid).toBe(true);
    expect(validateLeagueInput({ ...validLeague, maxTeams: 1 }).valid).toBe(false);
    expect(validateLeagueInput({ ...validLeague, maxTeams: 80 }).valid).toBe(false);
    expect(validateLeagueInput({ ...validLeague, entryFee: -5 }).valid).toBe(false);

    expect(validateTeamName('A', 'Eren').valid).toBe(false);
    expect(validateTeamName('Moda FK', 'K').valid).toBe(false);
    expect(validateTeamName('Moda FK', 'Eren Kılıç').valid).toBe(true);
  });

  it('validates gear item listing input', () => {
    const validGear = {
      title: 'Nike Mercurial Vapor 15',
      brand: 'Nike',
      size: '42.5 EU',
      price: 1500,
      description: 'Sadece 3 maçta giyildi, temiz durumda.',
      category: 'Boots' as const,
      condition: 'Çok İyi (Az Kullanılmış)' as const,
    };

    expect(validateGearInput(validGear).valid).toBe(true);
    expect(validateGearInput({ ...validGear, price: 0 }).valid).toBe(false);
    expect(validateGearInput({ ...validGear, description: 'Az' }).valid).toBe(false);
    expect(validateGearInput({ ...validGear, brand: ' ' }).valid).toBe(false);
  });

  it('prevents self-evaluation and validates evaluation rating bounds', () => {
    const evalInput = {
      matchId: 'match-1',
      matchTitle: 'Derbi',
      targetPlayerId: 'player-2',
      targetPlayerName: 'Ahmet Yılmaz',
      isOpponent: true,
      skillRating: 5,
      fairPlayRating: 4,
      badges: ['Fair-Play'],
      comment: 'Çok iyi oynadı',
    };

    expect(validateEvaluationInput(evalInput, 'player-2').valid).toBe(false);
    expect(validateEvaluationInput({ ...evalInput, skillRating: 0 }, 'player-1').valid).toBe(false);
    expect(validateEvaluationInput({ ...evalInput, fairPlayRating: 6 }, 'player-1').valid).toBe(
      false
    );
    expect(validateEvaluationInput(evalInput, 'player-1').valid).toBe(true);
    expect(validateReportReason('No').valid).toBe(false);
    expect(validateReportReason('Yanıltıcı içerik').valid).toBe(true);
  });

  it('validates facility (venue) evaluation ratings and comment length', () => {
    const validVenueEval = {
      matchId: 'match-1',
      venueId: 'venue-1',
      turfRating: 5,
      lightingRating: 4,
      lockerRoomRating: 4,
      organizationRating: 5,
      highlights: ['Yeni Suni Çim', 'Temiz Duş & Soyunma'],
      comment: 'Zemin çok iyiydi, ışıklandırma netti.',
    };

    expect(validateVenueEvaluationInput(validVenueEval).valid).toBe(true);
    expect(validateVenueEvaluationInput({ ...validVenueEval, matchId: '' }).valid).toBe(false);
    expect(validateVenueEvaluationInput({ ...validVenueEval, turfRating: 0 }).valid).toBe(false);
    expect(validateVenueEvaluationInput({ ...validVenueEval, lightingRating: 6 }).valid).toBe(
      false
    );
    expect(
      validateVenueEvaluationInput({ ...validVenueEval, lockerRoomRating: 3.5 }).valid
    ).toBe(false);
    expect(
      validateVenueEvaluationInput({
        ...validVenueEval,
        comment: 'a'.repeat(501),
      }).valid
    ).toBe(false);
  });
});

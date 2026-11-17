import { describe, expect, it } from '@jest/globals';
import { Match, RegionalLeague } from '../types';
import { generateAiMatchPrediction } from '../utils/aiPredictor';
import {
  resolveLeagueFixtureMatchupStats,
  resolveMatchupStats,
} from '../utils/matchupStats';

const sampleMatch: Match = {
  id: 'm-1',
  title: 'Kadıköy Akşam 7v7',
  organizerId: 'u-1',
  organizerName: 'Eren Kılıç',
  organizerPhone: '0555 111 22 33',
  venueName: 'Kalamış Halı Saha',
  address: 'Kadıköy, İstanbul',
  city: 'İstanbul',
  district: 'Kadıköy',
  date: '2026-11-22',
  time: '21:00 - 22:00',
  format: '7v7',
  pitchType: 'Açık Saha',
  feePerPlayer: 220,
  totalSlots: 14,
  missingPositions: ['GK'],
  roster: [
    {
      id: 's-1',
      position: 'MID',
      teamSide: 1,
      slotOrder: 0,
      isFilled: true,
      assignedPlayer: { id: 'u-1', name: 'Eren Kılıç', rating: 4.9, fairPlayRating: 5 },
      isOrganizer: true,
    },
    {
      id: 's-2',
      position: 'GK',
      teamSide: 1,
      slotOrder: 1,
      isFilled: false,
    },
  ],
  createdAt: '2026-11-18T12:00:00.000Z',
  prediction: {
    team1Name: 'Kadıköy Gücü',
    team2Name: 'Moda İdman',
    votesTeam1: 10,
    votesDraw: 4,
    votesTeam2: 6,
  },
};

const sampleLeague: RegionalLeague = {
  id: 'l-1',
  title: 'Kadıköy Süper Ligi',
  season: '2026 Güz',
  city: 'İstanbul',
  district: 'Kadıköy',
  venueName: 'Kalamış Arena',
  format: '7v7',
  status: 'IN_PROGRESS',
  maxTeams: 8,
  registeredTeamsCount: 2,
  entryFee: 1500,
  prize: '15.000₺ Kupa',
  organizerId: 'u-1',
  organizerName: 'Eren Kılıç',
  organizerPhone: '0555 111 22 33',
  description: 'Halı saha turnuvası',
  rules: ['Fair-Play'],
  teams: [
    {
      id: 'lt-1',
      name: 'Kadıköy Gücü',
      logoEmoji: '⚽',
      captainName: 'Eren',
      played: 5,
      won: 4,
      drawn: 1,
      lost: 0,
      goalsFor: 18,
      goalsAgainst: 7,
      goalDifference: 11,
      points: 13,
      form: ['W', 'W', 'D', 'W', 'W'],
    },
    {
      id: 'lt-2',
      name: 'Moda İdman',
      logoEmoji: '🛡️',
      captainName: 'Can',
      played: 5,
      won: 2,
      drawn: 1,
      lost: 2,
      goalsFor: 10,
      goalsAgainst: 11,
      goalDifference: -1,
      points: 7,
      form: ['L', 'W', 'D', 'L', 'W'],
    },
  ],
  fixtures: [
    {
      id: 'f-1',
      week: 1,
      homeTeamId: 'lt-1',
      awayTeamId: 'lt-2',
      homeTeamName: 'Kadıköy Gücü',
      awayTeamName: 'Moda İdman',
      homeScore: 4,
      awayScore: 2,
      date: '2026-11-10',
      time: '21:00',
      venue: 'Kalamış Arena',
      isFinished: true,
    },
  ],
  themeColor: '#16A34A',
  createdAt: '2026-11-01T10:00:00.000Z',
};

describe('matchupStats and aiPredictor', () => {
  it('resolves matchup stats from live match and league data without mocks', () => {
    const stats = resolveMatchupStats(sampleMatch, [sampleLeague]);
    expect(stats.team1.teamName).toBe('Kadıköy Gücü');
    expect(stats.team2.teamName).toBe('Moda İdman');
    expect(stats.team1.played).toBeGreaterThanOrEqual(0);
  });

  it('resolves league fixture matchup stats for scheduled fixtures', () => {
    const stats = resolveLeagueFixtureMatchupStats(sampleLeague.fixtures[0], sampleLeague);
    expect(stats.team1.teamName).toBe('Kadıköy Gücü');
    expect(stats.team2.teamName).toBe('Moda İdman');
    expect(stats.team1.played).toBe(5);
    expect(stats.team2.played).toBe(5);
  });

  it('produces valid probability distribution and prediction metrics', () => {
    const stats = resolveLeagueFixtureMatchupStats(sampleLeague.fixtures[0], sampleLeague);
    const ai = generateAiMatchPrediction(stats, {
      format: sampleMatch.format,
      roster: sampleMatch.roster,
    });

    expect(ai.probTeam1 + ai.probDraw + ai.probTeam2).toBe(100);
    expect(ai.predictedScore1).toBeGreaterThanOrEqual(0);
    expect(ai.predictedScore2).toBeGreaterThanOrEqual(0);
    expect(['1', 'X', '2']).toContain(ai.recommendedOutcome);
    expect(ai.insights.length).toBeGreaterThan(0);
  });
});

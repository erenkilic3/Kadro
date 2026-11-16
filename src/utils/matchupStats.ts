import {
  HeadToHeadMatch,
  HeadToHeadStats,
  LeagueFixture,
  LeagueTeam,
  Match,
  MatchupStats,
  RegionalLeague,
  TeamMatchStats,
  TeamRecentMatch,
} from '../types';
import { INITIAL_MATCHES } from '../constants/mockData';

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase('tr-TR');
}

function buildStatsFromLeagueTeam(
  team: LeagueTeam,
  league: RegionalLeague
): TeamMatchStats {
  const recentMatches: TeamRecentMatch[] = league.fixtures
    .filter(
      (f) =>
        f.isFinished &&
        typeof f.homeScore === 'number' &&
        typeof f.awayScore === 'number' &&
        (normalizeName(f.homeTeamName) === normalizeName(team.name) ||
          normalizeName(f.awayTeamName) === normalizeName(team.name))
    )
    .map((f) => {
      const isHome = normalizeName(f.homeTeamName) === normalizeName(team.name);
      const goalsFor = isHome ? f.homeScore! : f.awayScore!;
      const goalsAgainst = isHome ? f.awayScore! : f.homeScore!;
      const result: 'W' | 'D' | 'L' =
        goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';
      return {
        id: f.id,
        opponentName: isHome ? f.awayTeamName : f.homeTeamName,
        goalsFor,
        goalsAgainst,
        result,
        date: f.date,
        competition: league.title,
      };
    });

  return {
    teamName: team.name,
    logoEmoji: team.logoEmoji,
    played: team.played,
    won: team.won,
    drawn: team.drawn,
    lost: team.lost,
    goalsFor: team.goalsFor,
    goalsAgainst: team.goalsAgainst,
    form: team.form,
    recentMatches,
  };
}

function createEmptyTeamStats(teamName: string): TeamMatchStats {
  return {
    teamName,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    form: [],
    recentMatches: [],
  };
}

function findLeagueTeamStats(
  teamName: string,
  leagues: RegionalLeague[]
): TeamMatchStats | null {
  const target = normalizeName(teamName);
  for (const league of leagues) {
    const found = league.teams.find((t) => normalizeName(t.name) === target);
    if (found) {
      return buildStatsFromLeagueTeam(found, league);
    }
  }
  return null;
}

function computeHeadToHeadFromFixtures(
  team1Name: string,
  team2Name: string,
  fixtures: LeagueFixture[]
): HeadToHeadStats | undefined {
  const t1 = normalizeName(team1Name);
  const t2 = normalizeName(team2Name);

  const meetings = fixtures.filter(
    (f) =>
      f.isFinished &&
      typeof f.homeScore === 'number' &&
      typeof f.awayScore === 'number' &&
      ((normalizeName(f.homeTeamName) === t1 &&
        normalizeName(f.awayTeamName) === t2) ||
        (normalizeName(f.homeTeamName) === t2 &&
          normalizeName(f.awayTeamName) === t1))
  );

  if (meetings.length === 0) return undefined;

  let team1Wins = 0;
  let draws = 0;
  let team2Wins = 0;
  let team1Goals = 0;
  let team2Goals = 0;

  const recentMeetings: HeadToHeadMatch[] = meetings.map((f) => {
    const isTeam1Home = normalizeName(f.homeTeamName) === t1;
    const g1 = isTeam1Home ? f.homeScore! : f.awayScore!;
    const g2 = isTeam1Home ? f.awayScore! : f.homeScore!;

    team1Goals += g1;
    team2Goals += g2;

    if (g1 > g2) team1Wins += 1;
    else if (g2 > g1) team2Wins += 1;
    else draws += 1;

    return {
      id: f.id,
      date: f.date,
      team1Goals: g1,
      team2Goals: g2,
      venue: f.venue,
    };
  });

  return {
    totalMatches: meetings.length,
    team1Wins,
    draws,
    team2Wins,
    team1Goals,
    team2Goals,
    recentMeetings,
  };
}

/**
 * Resolves pre-match team comparison statistics for a match.
 * Falls back to cached initial mock data, league records, or zeroed starter stats.
 */
export function resolveMatchupStats(
  match: Match,
  leagues: RegionalLeague[]
): MatchupStats {
  if (match.matchupStats) {
    return match.matchupStats;
  }

  const seededMatch = INITIAL_MATCHES.find((m) => m.id === match.id);
  if (seededMatch?.matchupStats) {
    return seededMatch.matchupStats;
  }

  const team1Name =
    match.prediction?.team1Name ||
    `${match.organizerName.split(' ')[0] || 'Ev Sahibi'} & Ekibi`;
  const team2Name = match.prediction?.team2Name || 'Rakip Takım';

  const team1 =
    findLeagueTeamStats(team1Name, leagues) || createEmptyTeamStats(team1Name);
  const team2 =
    findLeagueTeamStats(team2Name, leagues) || createEmptyTeamStats(team2Name);

  const allFixtures = leagues.flatMap((l) => l.fixtures);
  const headToHead = computeHeadToHeadFromFixtures(
    team1Name,
    team2Name,
    allFixtures
  );

  return {
    team1,
    team2,
    headToHead,
  };
}

/**
 * Resolves pre-match team comparison statistics for a regional league fixture.
 */
export function resolveLeagueFixtureMatchupStats(
  fixture: LeagueFixture,
  league: RegionalLeague
): MatchupStats {
  const homeTeam = league.teams.find(
    (t) => normalizeName(t.name) === normalizeName(fixture.homeTeamName)
  );
  const awayTeam = league.teams.find(
    (t) => normalizeName(t.name) === normalizeName(fixture.awayTeamName)
  );

  const team1 = homeTeam
    ? buildStatsFromLeagueTeam(homeTeam, league)
    : createEmptyTeamStats(fixture.homeTeamName);
  const team2 = awayTeam
    ? buildStatsFromLeagueTeam(awayTeam, league)
    : createEmptyTeamStats(fixture.awayTeamName);

  const headToHead = computeHeadToHeadFromFixtures(
    fixture.homeTeamName,
    fixture.awayTeamName,
    league.fixtures
  );

  return {
    team1,
    team2,
    headToHead,
  };
}


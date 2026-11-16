import {
  AiMatchPrediction,
  MatchFormat,
  MatchupStats,
  PredictionChoice,
  RosterSlot,
  TeamMatchStats,
} from '../types';

const FORMAT_BASELINE_GOALS: Record<MatchFormat, number> = {
  '5v5': 3.3,
  '6v6': 3.0,
  '7v7': 2.7,
  '8v8': 2.4,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function poissonPmf(k: number, lambda: number): number {
  let factorial = 1;
  for (let i = 2; i <= k; i++) {
    factorial *= i;
  }
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial;
}

function computeFormIndex(form: ('W' | 'D' | 'L')[]): number {
  if (form.length === 0) return 0.5;
  const recent = form.slice(-5);
  let weightedSum = 0;
  let totalWeight = 0;

  recent.forEach((res, idx) => {
    const weight = idx + 1; // More recent matches carry slightly more weight
    const score = res === 'W' ? 1 : res === 'D' ? 0.45 : 0;
    weightedSum += score * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
}

function getAverageRosterRating(slots: RosterSlot[]): number | null {
  const rated = slots
    .map((s) => s.assignedPlayer?.rating)
    .filter((r): r is number => typeof r === 'number' && r > 0);
  if (rated.length === 0) return null;
  return rated.reduce((acc, r) => acc + r, 0) / rated.length;
}

function computeEffectiveTeamRates(
  team: TeamMatchStats,
  baseline: number
): { attack: number; defense: number; formIndex: number } {
  const sampleWeight = Math.min(1, team.played / 5);
  const rawAttack = team.played > 0 ? team.goalsFor / team.played : baseline;
  const rawDefense = team.played > 0 ? team.goalsAgainst / team.played : baseline;

  return {
    attack: sampleWeight * rawAttack + (1 - sampleWeight) * baseline,
    defense: sampleWeight * rawDefense + (1 - sampleWeight) * baseline,
    formIndex: computeFormIndex(team.form),
  };
}

function pickModalScoreForOutcome(
  lambda1: number,
  lambda2: number,
  outcome: PredictionChoice
): { score1: number; score2: number } {
  let bestScore1 = outcome === '1' ? 3 : outcome === '2' ? 2 : 2;
  let bestScore2 = outcome === '1' ? 2 : outcome === '2' ? 3 : 2;
  let bestProb = -1;

  for (let i = 0; i <= 9; i++) {
    const p1 = poissonPmf(i, lambda1);
    for (let j = 0; j <= 9; j++) {
      const matchesOutcome =
        (outcome === '1' && i > j) ||
        (outcome === 'X' && i === j) ||
        (outcome === '2' && i < j);

      if (!matchesOutcome) continue;

      const joint = p1 * poissonPmf(j, lambda2);
      if (joint > bestProb) {
        bestProb = joint;
        bestScore1 = i;
        bestScore2 = j;
      }
    }
  }

  return { score1: bestScore1, score2: bestScore2 };
}

function buildInsights(
  stats: MatchupStats,
  lambda1: number,
  lambda2: number,
  bttsProbability: number,
  overUnderLine: number,
  overUnderPick: 'ÜST' | 'ALT'
): string[] {
  const { team1, team2, headToHead } = stats;
  const insights: string[] = [];

  if (team1.played === 0 && team2.played === 0) {
    insights.push(
      'Her iki takım için henüz kayıtlı geçmiş maç verisi bulunmadığından format ortalaması ve kadro gücü baz alındı.'
    );
    insights.push(
      `Maç formatına göre beklenen toplam gol temposu ${(lambda1 + lambda2).toFixed(1)} gol seviyesinde.`
    );
    insights.push(
      `Karşılıklı gol (KG Var) ihtimali %${bttsProbability} olarak hesaplandı.`
    );
    return insights;
  }

  const avg1 = team1.played > 0 ? (team1.goalsFor / team1.played).toFixed(1) : '0.0';
  const avg2 = team2.played > 0 ? (team2.goalsFor / team2.played).toFixed(1) : '0.0';
  const betterAttackTeam = Number(avg1) >= Number(avg2) ? team1 : team2;
  const betterAvg = Number(avg1) >= Number(avg2) ? avg1 : avg2;

  insights.push(
    `${betterAttackTeam.teamName}, oynadığı ${betterAttackTeam.played} maçta maç başına ${betterAvg} gol ortalamasıyla hücumda öne çıkıyor.`
  );

  if (headToHead && headToHead.totalMatches > 0) {
    const avgH2hGoals = (
      (headToHead.team1Goals + headToHead.team2Goals) /
      headToHead.totalMatches
    ).toFixed(1);
    insights.push(
      `Aralarındaki son ${headToHead.totalMatches} maçta ortalama ${avgH2hGoals} gol atıldı (${headToHead.team1Wins}G - ${headToHead.draws}B - ${headToHead.team2Wins}M).`
    );
  } else {
    const winRate1 = team1.played > 0 ? Math.round((team1.won / team1.played) * 100) : 0;
    const winRate2 = team2.played > 0 ? Math.round((team2.won / team2.played) * 100) : 0;
    insights.push(
      `Galibiyet oranları: ${team1.teamName} %${winRate1} vs ${team2.teamName} %${winRate2}.`
    );
  }

  insights.push(
    `Toplam ${(lambda1 + lambda2).toFixed(1)} gol beklentisiyle ${overUnderLine} ${overUnderPick} ve %${bttsProbability} ihtimalle ${
      bttsProbability >= 55 ? 'KG Var' : 'kontrollü oyun'
    } öngörülüyor.`
  );

  return insights;
}

/**
 * Generates an on-device statistical AI score and outcome prediction from
 * team history, recent form, head-to-head results, and optional squad ratings.
 */
export function generateAiMatchPrediction(
  stats: MatchupStats,
  options?: {
    format?: MatchFormat;
    roster?: RosterSlot[];
  }
): AiMatchPrediction {
  const { team1, team2, headToHead } = stats;
  const baseline = FORMAT_BASELINE_GOALS[options?.format || '7v7'];

  const rate1 = computeEffectiveTeamRates(team1, baseline);
  const rate2 = computeEffectiveTeamRates(team2, baseline);

  // Form momentum modifier in range ~[0.9, 1.12]
  const formMod1 = 0.9 + rate1.formIndex * 0.22;
  const formMod2 = 0.9 + rate2.formIndex * 0.22;

  // Optional roster rating adjustment if lineup ratings exist
  let rosterMod1 = 1;
  let rosterMod2 = 1;
  if (options?.roster && options.roster.length > 0) {
    const half = Math.ceil(options.roster.length / 2);
    const avgR1 = getAverageRosterRating(options.roster.slice(0, half));
    const avgR2 = getAverageRosterRating(options.roster.slice(half));
    if (avgR1 !== null && avgR2 !== null) {
      const diff = clamp(avgR1 - avgR2, -0.5, 0.5);
      rosterMod1 = 1 + diff * 0.14;
      rosterMod2 = 1 - diff * 0.14;
    }
  }

  // Head-to-head subtle edge
  let h2hNudge = 0;
  if (headToHead && headToHead.totalMatches >= 2) {
    h2hNudge =
      ((headToHead.team1Wins - headToHead.team2Wins) / headToHead.totalMatches) *
      0.18;
  }

  const lambda1 = clamp(
    (rate1.attack * 0.56 + rate2.defense * 0.44) * formMod1 * rosterMod1 + h2hNudge,
    0.9,
    5.8
  );
  const lambda2 = clamp(
    (rate2.attack * 0.56 + rate1.defense * 0.44) * formMod2 * rosterMod2 - h2hNudge,
    0.9,
    5.8
  );

  // Compute Poisson outcome distribution
  let rawP1 = 0;
  let rawPX = 0;
  let rawP2 = 0;

  for (let i = 0; i <= 10; i++) {
    const p1 = poissonPmf(i, lambda1);
    for (let j = 0; j <= 10; j++) {
      const joint = p1 * poissonPmf(j, lambda2);
      if (i > j) rawP1 += joint;
      else if (i === j) rawPX += joint;
      else rawP2 += joint;
    }
  }

  const totalP = rawP1 + rawPX + rawP2 || 1;
  const probTeam1 = Math.round((rawP1 / totalP) * 100);
  const probDraw = Math.round((rawPX / totalP) * 100);
  const probTeam2 = Math.max(0, 100 - probTeam1 - probDraw);

  let recommendedOutcome: PredictionChoice = '1';
  if (probTeam2 > probTeam1 && probTeam2 >= probDraw) {
    recommendedOutcome = '2';
  } else if (probDraw > probTeam1 && probDraw > probTeam2) {
    recommendedOutcome = 'X';
  }

  const recommendedLabel =
    recommendedOutcome === '1'
      ? `${team1.teamName} Kazanır`
      : recommendedOutcome === '2'
      ? `${team2.teamName} Kazanır`
      : 'Beraberlik';

  const { score1, score2 } = pickModalScoreForOutcome(
    lambda1,
    lambda2,
    recommendedOutcome
  );

  // Both Teams To Score probability: (1 - P(X1=0)) * (1 - P(X2=0))
  const bttsRaw = (1 - poissonPmf(0, lambda1)) * (1 - poissonPmf(0, lambda2));
  const bttsProbability = Math.round(clamp(bttsRaw * 100, 15, 96));
  const bttsYes = bttsProbability >= 55;

  const expectedTotalGoals = Number((lambda1 + lambda2).toFixed(1));
  const overUnderLine = baseline >= 3.0 ? 5.5 : 4.5;
  const overUnderPick: 'ÜST' | 'ALT' =
    expectedTotalGoals >= overUnderLine ? 'ÜST' : 'ALT';

  const totalPlayed = team1.played + team2.played;
  const dataQuality: AiMatchPrediction['dataQuality'] =
    totalPlayed >= 10 ? 'Yüksek Veri' : totalPlayed >= 2 ? 'Orta Veri' : 'İlk Analiz';

  const maxProb = Math.max(probTeam1, probDraw, probTeam2);
  const dataBonus = Math.min(24, totalPlayed * 1.4 + (headToHead?.totalMatches || 0) * 2);
  const confidence = Math.round(clamp(maxProb * 0.85 + dataBonus, 46, 91));

  const insights = buildInsights(
    stats,
    lambda1,
    lambda2,
    bttsProbability,
    overUnderLine,
    overUnderPick
  );

  return {
    predictedScore1: score1,
    predictedScore2: score2,
    recommendedOutcome,
    recommendedLabel,
    probTeam1,
    probDraw,
    probTeam2,
    confidence,
    dataQuality,
    expectedTotalGoals,
    overUnderLine,
    overUnderPick,
    bttsYes,
    bttsProbability,
    insights,
  };
}


import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AiMatchPrediction,
  MatchupStats,
  PredictionChoice,
} from '../types';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';

interface AiPredictionBotCardProps {
  stats: MatchupStats;
  prediction: AiMatchPrediction;
  userVote?: PredictionChoice;
  isCompleted?: boolean;
  finalScore?: { team1: number; team2: number };
  onApplyOutcome?: (choice: PredictionChoice) => void;
}

export const AiPredictionBotCard: React.FC<AiPredictionBotCardProps> = ({
  stats,
  prediction,
  userVote,
  isCompleted = false,
  finalScore,
  onApplyOutcome,
}) => {
  const { colors } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [showReasons, setShowReasons] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleRescan = () => {
    if (isScanning) return;
    setIsScanning(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsScanning(false);
    }, 450);
  };

  const actualOutcome: PredictionChoice | null = finalScore
    ? finalScore.team1 > finalScore.team2
      ? '1'
      : finalScore.team1 < finalScore.team2
      ? '2'
      : 'X'
    : null;
  const didAiHitOutcome =
    actualOutcome !== null && actualOutcome === prediction.recommendedOutcome;
  const isApplied = userVote === prediction.recommendedOutcome;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceLight }]}>
            <Ionicons name="pulse-outline" size={17} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Skor & Sonuç Öngörüsü</Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              Form, gol ortalaması ve kadro dengesi ({prediction.dataQuality})
            </Text>
          </View>
        </View>

        <View style={[styles.confidenceBadge, { backgroundColor: `${colors.primary}18` }]}>
          <Text style={[styles.confidenceText, { color: colors.primary }]}>
            %{prediction.confidence} güven
          </Text>
        </View>
      </View>

      {isScanning ? (
        <View style={[styles.scanningBox, { backgroundColor: colors.surfaceLight }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.scanningText, { color: colors.textSecondary }]}>
            Veriler yeniden hesaplanıyor...
          </Text>
        </View>
      ) : (
        <>
          {/* Score Prediction Hero */}
          <View style={[styles.scoreHeroBox, { backgroundColor: colors.surfaceLight }]}>
            <View style={styles.scoreMatchupRow}>
              <Text style={[styles.teamLabel, { color: colors.text }]} numberOfLines={2}>
                {stats.team1.teamName}
              </Text>

              <View style={[styles.scoreBadge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.scoreText, { color: colors.text }]}>
                  {prediction.predictedScore1} - {prediction.predictedScore2}
                </Text>
              </View>

              <Text style={[styles.teamLabel, { color: colors.text }]} numberOfLines={2}>
                {stats.team2.teamName}
              </Text>
            </View>

            <View style={styles.outcomeRow}>
              <Text style={[styles.outcomeLabel, { color: colors.textSecondary }]}>
                Öngörülen sonuç:{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  {prediction.recommendedOutcome} · {prediction.recommendedLabel}
                </Text>
              </Text>
            </View>

            {isCompleted && finalScore && (
              <View style={[styles.actualRow, { borderTopColor: colors.surfaceBorder }]}>
                <Text style={[styles.actualText, { color: colors.textSecondary }]}>
                  Maç skoru: {finalScore.team1} - {finalScore.team2}
                </Text>
                <Text
                  style={[
                    styles.actualStatus,
                    { color: didAiHitOutcome ? colors.success : colors.textTertiary },
                  ]}
                >
                  {didAiHitOutcome ? 'Tahmin isabetli' : 'Tamamlandı'}
                </Text>
              </View>
            )}
          </View>

          {/* Probability Distribution */}
          <View style={styles.probSection}>
            <View style={styles.probLabelsRow}>
              <Text style={[styles.probText, { color: colors.primary }]}>
                Ev Sahibi %{prediction.probTeam1}
              </Text>
              <Text style={[styles.probText, { color: colors.warning }]}>
                Berabere %{prediction.probDraw}
              </Text>
              <Text style={[styles.probText, { color: colors.info }]}>
                Deplasman %{prediction.probTeam2}
              </Text>
            </View>

            <View style={styles.probBarTrack}>
              <View
                style={[
                  styles.probBarPart,
                  { width: `${prediction.probTeam1}%`, backgroundColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.probBarPart,
                  { width: `${prediction.probDraw}%`, backgroundColor: colors.warning },
                ]}
              />
              <View
                style={[
                  styles.probBarPart,
                  { width: `${prediction.probTeam2}%`, backgroundColor: colors.info },
                ]}
              />
            </View>
          </View>

          {/* Market Chips */}
          <View style={styles.marketsRow}>
            <View style={[styles.marketChip, { backgroundColor: colors.surfaceLight }]}>
              <Text style={[styles.marketChipText, { color: colors.text }]}>
                {prediction.overUnderLine} {prediction.overUnderPick}
              </Text>
            </View>
            <View style={[styles.marketChip, { backgroundColor: colors.surfaceLight }]}>
              <Text style={[styles.marketChipText, { color: colors.text }]}>
                {prediction.bttsYes ? 'KG Var' : 'KG Yok'} (%{prediction.bttsProbability})
              </Text>
            </View>
            <View style={[styles.marketChip, { backgroundColor: colors.surfaceLight }]}>
              <Text style={[styles.marketChipText, { color: colors.textSecondary }]}>
                Gol beklentisi: {prediction.expectedTotalGoals}
              </Text>
            </View>
          </View>

          {/* Expandable Analysis Notes */}
          <TouchableOpacity
            style={[styles.reasoningToggle, { borderTopColor: colors.surfaceBorder }]}
            onPress={() => setShowReasons((prev) => !prev)}
            activeOpacity={0.75}
          >
            <Text style={[styles.reasoningToggleText, { color: colors.textSecondary }]}>
              Analiz Notları
            </Text>
            <Ionicons
              name={showReasons ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {showReasons && (
            <View style={styles.insightsList}>
              {prediction.insights.map((line, index) => (
                <View key={index} style={styles.insightRow}>
                  <View style={[styles.insightDot, { backgroundColor: colors.textTertiary }]} />
                  <Text style={[styles.insightText, { color: colors.textSecondary }]}>{line}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.rescanBtn, { backgroundColor: colors.surfaceLight }]}
              onPress={handleRescan}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={14} color={colors.text} />
              <Text style={[styles.rescanBtnText, { color: colors.text }]}>Yenile</Text>
            </TouchableOpacity>

            {!isCompleted && onApplyOutcome && (
              <TouchableOpacity
                style={[
                  styles.applyBtn,
                  {
                    backgroundColor: isApplied ? `${colors.primary}20` : colors.primary,
                  },
                ]}
                onPress={() => onApplyOutcome(prediction.recommendedOutcome)}
                disabled={isApplied}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.applyBtnText,
                    { color: isApplied ? colors.primary : '#FFFFFF' },
                  ]}
                >
                  {isApplied ? 'Tahmin Seçildi' : 'Bu Tahmini Oyla'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.md,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scanningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    borderRadius: RADIUS.md,
    gap: 10,
  },
  scanningText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  scoreHeroBox: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  scoreMatchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  teamLabel: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  scoreText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: 1,
  },
  outcomeRow: {
    alignItems: 'center',
  },
  outcomeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    paddingTop: 8,
  },
  actualText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actualStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  probSection: {
    marginBottom: SPACING.md,
  },
  probLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  probText: {
    fontSize: 11,
    fontWeight: '700',
  },
  probBarTrack: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    gap: 2,
  },
  probBarPart: {
    height: '100%',
  },
  marketsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  marketChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  marketChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reasoningToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: SPACING.sm + 2,
    paddingBottom: 6,
    marginTop: 4,
  },
  reasoningToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  insightsList: {
    gap: 6,
    marginBottom: SPACING.md,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  insightDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rescanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  rescanBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
  },
  applyBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});

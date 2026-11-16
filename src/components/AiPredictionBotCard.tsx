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
import { FONT_SIZE, SPACING } from '../constants/theme';

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
  const { colors, isDark } = useTheme();
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

  const botAccent = isDark ? '#A78BFA' : '#7C3AED';
  const botBg = isDark ? 'rgba(139, 92, 246, 0.14)' : 'rgba(124, 58, 237, 0.08)';
  const botBorder = isDark ? 'rgba(167, 139, 250, 0.35)' : 'rgba(124, 58, 237, 0.25)';

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
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: botBorder,
          shadowColor: colors.cardShadow,
        },
      ]}
    >
      {/* Top Accent Strip */}
      <View style={[styles.topStrip, { backgroundColor: botAccent }]} />

      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={[styles.botAvatar, { backgroundColor: botBg, borderColor: botBorder }]}>
            <Ionicons name="hardware-chip" size={20} color={botAccent} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.titleLine}>
              <Text style={[styles.botTitle, { color: colors.text }]}>
                KadroAI Tahmin Robotu
              </Text>
              <View style={[styles.aiPill, { backgroundColor: botBg }]}>
                <Ionicons name="sparkles" size={10} color={botAccent} />
                <Text style={[styles.aiPillText, { color: botAccent }]}>AI BOT</Text>
              </View>
            </View>
            <Text style={[styles.botSubtitle, { color: colors.textSecondary }]}>
              Form, gol ortalaması ve kadro gücü analizi
            </Text>
          </View>

          <View
            style={[
              styles.confidenceBox,
              {
                backgroundColor: isDark ? colors.surfaceLight : '#F5F3FF',
                borderColor: botBorder,
              },
            ]}
          >
            <Text style={[styles.confidenceNum, { color: botAccent }]}>
              %{prediction.confidence}
            </Text>
            <Text style={[styles.confidenceLbl, { color: colors.textTertiary }]}>
              Güven
            </Text>
          </View>
        </View>

        {isScanning ? (
          <View
            style={[
              styles.scanningBox,
              {
                backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <ActivityIndicator size="small" color={botAccent} />
            <Text style={[styles.scanningText, { color: colors.textSecondary }]}>
              KadroAI önceki maç verilerini ve gol beklentisini yeniden hesaplıyor...
            </Text>
          </View>
        ) : (
          <>
            {/* Score & Outcome Prediction Hero */}
            <View
              style={[
                styles.scoreHeroBox,
                {
                  backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.scoreHeroLabel, { color: colors.textTertiary }]}>
                🤖 MAÇ ÖNCESİ AI SKOR & SONUÇ TAHMİNİ
              </Text>

              <View style={styles.scoreMatchupRow}>
                <View style={styles.teamCol}>
                  <Text style={[styles.teamLabel, { color: colors.text }]} numberOfLines={2}>
                    {stats.team1.teamName}
                  </Text>
                </View>

                <View
                  style={[
                    styles.predictedScoreBadge,
                    { backgroundColor: botBg, borderColor: botBorder },
                  ]}
                >
                  <Text style={[styles.predictedScoreText, { color: botAccent }]}>
                    {prediction.predictedScore1} - {prediction.predictedScore2}
                  </Text>
                </View>

                <View style={styles.teamCol}>
                  <Text style={[styles.teamLabel, { color: colors.text }]} numberOfLines={2}>
                    {stats.team2.teamName}
                  </Text>
                </View>
              </View>

              <View style={[styles.outcomeBanner, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="checkmark-done-circle" size={16} color={colors.primary} />
                <Text style={[styles.outcomeBannerText, { color: colors.text }]}>
                  Sonuç Tahmini:{' '}
                  <Text style={{ color: colors.primary, fontWeight: '900' }}>
                    {prediction.recommendedOutcome} ({prediction.recommendedLabel})
                  </Text>
                </Text>
              </View>

              {/* Compare with actual score if match is completed */}
              {isCompleted && finalScore && (
                <View
                  style={[
                    styles.actualResultRow,
                    {
                      backgroundColor: didAiHitOutcome
                        ? `${colors.success}18`
                        : isDark
                        ? 'rgba(255,255,255,0.04)'
                        : '#EEF2F6',
                      borderColor: didAiHitOutcome ? colors.success : colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.actualResultText, { color: colors.textSecondary }]}>
                    Gerçek Skor:{' '}
                    <Text style={{ color: colors.text, fontWeight: '800' }}>
                      {finalScore.team1} - {finalScore.team2}
                    </Text>
                  </Text>
                  <Text
                    style={[
                      styles.actualHitBadge,
                      { color: didAiHitOutcome ? colors.success : colors.textSecondary },
                    ]}
                  >
                    {didAiHitOutcome ? '🎯 Sonuç Tuttu!' : '📊 Tamamlandı'}
                  </Text>
                </View>
              )}
            </View>

            {/* Probability Distribution */}
            <View style={styles.probSection}>
              <View style={styles.probLabelsRow}>
                <Text style={[styles.probItemText, { color: colors.primary }]}>
                  1: %{prediction.probTeam1}
                </Text>
                <Text style={[styles.probItemText, { color: colors.warning }]}>
                  X: %{prediction.probDraw}
                </Text>
                <Text style={[styles.probItemText, { color: colors.info }]}>
                  2: %{prediction.probTeam2}
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

            {/* Extra Prediction Markets (Over/Under, BTTS, Data Quality) */}
            <View style={styles.marketsRow}>
              <View
                style={[
                  styles.marketChip,
                  {
                    backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Ionicons name="football-outline" size={13} color={colors.primary} />
                <Text style={[styles.marketChipText, { color: colors.text }]}>
                  {prediction.overUnderLine} {prediction.overUnderPick}
                </Text>
              </View>

              <View
                style={[
                  styles.marketChip,
                  {
                    backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Ionicons name="flash-outline" size={13} color={colors.warning} />
                <Text style={[styles.marketChipText, { color: colors.text }]}>
                  {prediction.bttsYes ? 'KG Var' : 'KG Yok'} (%{prediction.bttsProbability})
                </Text>
              </View>

              <View
                style={[
                  styles.marketChip,
                  {
                    backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC',
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Ionicons name="analytics-outline" size={13} color={botAccent} />
                <Text style={[styles.marketChipText, { color: colors.textSecondary }]}>
                  {prediction.dataQuality}
                </Text>
              </View>
            </View>

            {/* AI Reasoning Section */}
            <TouchableOpacity
              style={styles.reasoningToggle}
              onPress={() => setShowReasons((prev) => !prev)}
              activeOpacity={0.75}
            >
              <Text style={[styles.reasoningToggleText, { color: botAccent }]}>
                🤖 Robotun Analiz Gerekçesi
              </Text>
              <Ionicons
                name={showReasons ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={botAccent}
              />
            </TouchableOpacity>

            {showReasons && (
              <View
                style={[
                  styles.insightsBox,
                  {
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.08)' : '#FAF5FF',
                    borderColor: botBorder,
                  },
                ]}
              >
                {prediction.insights.map((line, index) => (
                  <View key={index} style={styles.insightRow}>
                    <View style={[styles.insightDot, { backgroundColor: botAccent }]} />
                    <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                      {line}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.rescanBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9',
                    borderColor: colors.surfaceBorder,
                  },
                ]}
                onPress={handleRescan}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={15} color={colors.text} />
                <Text style={[styles.rescanBtnText, { color: colors.text }]}>
                  Yeniden Analiz Et
                </Text>
              </TouchableOpacity>

              {!isCompleted && onApplyOutcome && (
                <TouchableOpacity
                  style={[
                    styles.applyBtn,
                    {
                      backgroundColor: isApplied ? `${colors.primary}20` : botAccent,
                      borderColor: isApplied ? colors.primary : botAccent,
                    },
                  ]}
                  onPress={() => onApplyOutcome(prediction.recommendedOutcome)}
                  disabled={isApplied}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={isApplied ? 'checkmark-circle' : 'sparkles'}
                    size={15}
                    color={isApplied ? colors.primary : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.applyBtnText,
                      { color: isApplied ? colors.primary : '#FFFFFF' },
                    ]}
                  >
                    {isApplied ? 'AI Tahmini Seçildi' : 'AI Tahminine Katıl'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  topStrip: {
    height: 4,
    width: '100%',
  },
  inner: {
    padding: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.md,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  aiPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  botSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  confidenceBox: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  confidenceNum: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
  },
  confidenceLbl: {
    fontSize: 9,
    fontWeight: '700',
  },
  scanningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  scanningText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    lineHeight: 18,
  },
  scoreHeroBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: SPACING.sm + 2,
  },
  scoreHeroLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: 10,
  },
  scoreMatchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
  },
  teamLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    textAlign: 'center',
  },
  predictedScoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  predictedScoreText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    letterSpacing: 1,
  },
  outcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  outcomeBannerText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  actualResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actualResultText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actualHitBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  probSection: {
    marginBottom: SPACING.sm + 2,
  },
  probLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  probItemText: {
    fontSize: 11,
    fontWeight: '800',
  },
  probBarTrack: {
    flexDirection: 'row',
    height: 7,
    borderRadius: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  marketChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reasoningToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  reasoningToggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  insightsBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 7,
    marginBottom: SPACING.sm + 2,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  insightText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  rescanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  rescanBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  applyBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
});


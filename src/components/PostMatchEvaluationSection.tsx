import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { PositionBadge } from './PositionBadge';
import { PlayerEvaluationModal, EvaluationTargetPlayer } from './PlayerEvaluationModal';
import { FONT_SIZE, SPACING } from '../constants/theme';
import { Match, PlayerPosition } from '../types';

interface PostMatchEvaluationSectionProps {
  match: Match;
  currentUserId: string;
}

export const PostMatchEvaluationSection: React.FC<PostMatchEvaluationSectionProps> = ({
  match,
  currentUserId,
}) => {
  const { colors, isDark } = useTheme();
  const { submitPlayerEvaluation, hasUserEvaluatedPlayer, evaluations } = useApp();

  const [selectedFilter, setSelectedFilter] = useState<'OPPONENTS' | 'TEAMMATES' | 'ALL'>('OPPONENTS');
  const [activePlayerToRate, setActivePlayerToRate] = useState<EvaluationTargetPlayer | null>(null);

  // Divide roster into Home and Away
  const half = Math.ceil(match.roster.length / 2);
  const userSlotIndex = match.roster.findIndex((s) => s.assignedPlayer?.id === currentUserId);
  const isUserHome = userSlotIndex !== -1 ? userSlotIndex < half : true;

  const matchPlayers = useMemo(() => {
    return match.roster
      .map((slot, index) => {
        if (!slot.isFilled || !slot.assignedPlayer) return null;
        if (slot.assignedPlayer.id === currentUserId) return null; // Don't rate yourself

        const isHome = index < half;
        const isOpponent = isUserHome ? !isHome : isHome;

        const isEvaluated = hasUserEvaluatedPlayer(match.id, slot.assignedPlayer.id);
        const existingEval = evaluations.find(
          (e) => e.matchId === match.id && e.targetPlayerId === slot.assignedPlayer?.id
        );

        return {
          id: slot.assignedPlayer.id,
          name: slot.assignedPlayer.name,
          position: slot.position,
          rating: slot.assignedPlayer.rating || 4.8,
          fairPlayRating: slot.assignedPlayer.fairPlayRating || 4.9,
          isOpponent,
          isEvaluated,
          evaluation: existingEval,
        };
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      position: PlayerPosition;
      rating: number;
      fairPlayRating: number;
      isOpponent: boolean;
      isEvaluated: boolean;
      evaluation?: any;
    }[];
  }, [match.roster, currentUserId, isUserHome, evaluations, hasUserEvaluatedPlayer]);

  const filteredPlayers = useMemo(() => {
    return matchPlayers.filter((p) => {
      if (selectedFilter === 'OPPONENTS') return p.isOpponent;
      if (selectedFilter === 'TEAMMATES') return !p.isOpponent;
      return true;
    });
  }, [matchPlayers, selectedFilter]);

  const opponentCount = matchPlayers.filter((p) => p.isOpponent).length;
  const teammateCount = matchPlayers.filter((p) => !p.isOpponent).length;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
          shadowColor: colors.cardShadow,
        },
      ]}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="star" size={18} color="#F59E0B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Maç Sonu Oyuncu Değerlendirmesi
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Rakiplerin ve takım arkadaşlarının yetenek & Fair-Play seviyesini puanla
          </Text>
        </View>
      </View>

      {/* Info Callout */}
      <View
        style={[
          styles.rewardBox,
          {
            backgroundColor: isDark ? 'rgba(0, 214, 100, 0.1)' : 'rgba(0, 214, 100, 0.08)',
            borderColor: 'rgba(0, 214, 100, 0.25)',
          },
        ]}
      >
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <Text style={[styles.rewardText, { color: colors.textSecondary }]}>
          Her değerlendirme için <Text style={{ color: colors.primary, fontWeight: '800' }}>+15 Kadro Puanı</Text> kazan ve centilmen halı saha topluluğuna katkıda bulun.
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            selectedFilter === 'OPPONENTS' && [styles.tabBtnActive, { backgroundColor: colors.surfaceLight, borderColor: colors.primary }],
          ]}
          onPress={() => setSelectedFilter('OPPONENTS')}
        >
          <Text
            style={[
              styles.tabBtnText,
              { color: selectedFilter === 'OPPONENTS' ? colors.primary : colors.textTertiary },
            ]}
          >
            ⚔️ Rakipler ({opponentCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            selectedFilter === 'TEAMMATES' && [styles.tabBtnActive, { backgroundColor: colors.surfaceLight, borderColor: colors.primary }],
          ]}
          onPress={() => setSelectedFilter('TEAMMATES')}
        >
          <Text
            style={[
              styles.tabBtnText,
              { color: selectedFilter === 'TEAMMATES' ? colors.primary : colors.textTertiary },
            ]}
          >
            🛡️ Takım Arkadaşlarım ({teammateCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            selectedFilter === 'ALL' && [styles.tabBtnActive, { backgroundColor: colors.surfaceLight, borderColor: colors.primary }],
          ]}
          onPress={() => setSelectedFilter('ALL')}
        >
          <Text
            style={[
              styles.tabBtnText,
              { color: selectedFilter === 'ALL' ? colors.primary : colors.textTertiary },
            ]}
          >
            Tümü ({matchPlayers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Players List */}
      <View style={styles.playersList}>
        {filteredPlayers.map((player) => (
          <View
            key={player.id}
            style={[
              styles.playerCard,
              {
                backgroundColor: colors.surfaceLight,
                borderColor: player.isEvaluated ? 'rgba(0, 214, 100, 0.3)' : colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.playerInfoCol}>
              <View style={styles.playerNameRow}>
                <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>
                  {player.name}
                </Text>
                <PositionBadge position={player.position} size="sm" />
              </View>

              <View style={styles.playerTagsRow}>
                <Text
                  style={[
                    styles.roleTag,
                    { color: player.isOpponent ? colors.danger : colors.primary },
                  ]}
                >
                  {player.isOpponent ? '⚔️ Rakip' : '🛡️ Takım Arkadaşı'}
                </Text>
                <Text style={[styles.fairPlayTag, { color: colors.textSecondary }]}>
                  🤝 %{Math.round((player.fairPlayRating / 5) * 100)} Fair-Play
                </Text>
              </View>

              {/* Badges preview if evaluated */}
              {player.evaluation?.badges && player.evaluation.badges.length > 0 && (
                <View style={styles.evalBadgesRow}>
                  {player.evaluation.badges.slice(0, 2).map((b: string, i: number) => (
                    <View key={i} style={[styles.evalBadgePill, { backgroundColor: `${colors.primary}20` }]}>
                      <Text style={[styles.evalBadgeText, { color: colors.primary }]}>{b}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Action or Done State */}
            {player.isEvaluated ? (
              <View style={styles.evaluatedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={[styles.evaluatedText, { color: colors.primary }]}>Puanlandı</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.rateBtn, { backgroundColor: colors.primary }]}
                onPress={() =>
                  setActivePlayerToRate({
                    id: player.id,
                    name: player.name,
                    position: player.position,
                    isOpponent: player.isOpponent,
                    currentRating: player.rating,
                    currentFairPlay: player.fairPlayRating,
                  })
                }
                activeOpacity={0.8}
              >
                <Ionicons name="star" size={13} color="#FFFFFF" />
                <Text style={styles.rateBtnText}>Değerlendir</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Evaluation Modal */}
      <PlayerEvaluationModal
        visible={Boolean(activePlayerToRate)}
        matchId={match.id}
        matchTitle={match.title}
        player={activePlayerToRate}
        onClose={() => setActivePlayerToRate(null)}
        onSubmit={async (data) => {
          return await submitPlayerEvaluation(data);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: SPACING.md,
    marginTop: SPACING.md,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  rewardText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  tabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {},
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  playersList: {
    gap: 8,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  playerInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  playerName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  playerTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: '700',
  },
  fairPlayTag: {
    fontSize: 10,
    fontWeight: '500',
  },
  evalBadgesRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  evalBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  evalBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  rateBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  evaluatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  evaluatedText: {
    fontSize: 11,
    fontWeight: '800',
  },
});

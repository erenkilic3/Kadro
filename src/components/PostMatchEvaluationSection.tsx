import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { PositionBadge } from './PositionBadge';
import { PlayerEvaluationModal, EvaluationTargetPlayer } from './PlayerEvaluationModal';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';
import { Match, PlayerEvaluation, PlayerPosition } from '../types';
import { stripLeadingSymbols } from '../utils/formatters';

interface PostMatchEvaluationSectionProps {
  match: Match;
  currentUserId: string;
}

export const PostMatchEvaluationSection: React.FC<PostMatchEvaluationSectionProps> = ({
  match,
  currentUserId,
}) => {
  const { colors } = useTheme();
  const { submitPlayerEvaluation, hasUserEvaluatedPlayer, evaluations } = useApp();

  const [selectedFilter, setSelectedFilter] = useState<'OPPONENTS' | 'TEAMMATES' | 'ALL'>('OPPONENTS');
  const [activePlayerToRate, setActivePlayerToRate] = useState<EvaluationTargetPlayer | null>(null);

  const half = Math.ceil(match.roster.length / 2);
  const userSlotIndex = match.roster.findIndex((s) => s.assignedPlayer?.id === currentUserId);
  const isUserHome = userSlotIndex !== -1 ? userSlotIndex < half : true;

  const matchPlayers = useMemo(() => {
    return match.roster
      .map((slot, index) => {
        if (!slot.isFilled || !slot.assignedPlayer || !slot.assignedPlayer.id) return null;
        if (slot.assignedPlayer.id === currentUserId) return null;

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
      evaluation?: PlayerEvaluation;
    }[];
  }, [match.id, match.roster, half, currentUserId, isUserHome, evaluations, hasUserEvaluatedPlayer]);

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
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Maç Sonu Değerlendirme
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Oyuncuların performans ve Fair-Play puanını belirle
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterTabsRow, { borderBottomColor: colors.surfaceBorder }]}>
        {(
          [
            { key: 'OPPONENTS' as const, label: `Rakipler (${opponentCount})` },
            { key: 'TEAMMATES' as const, label: `Takım (${teammateCount})` },
            { key: 'ALL' as const, label: `Tümü (${matchPlayers.length})` },
          ]
        ).map((tab) => {
          const isActive = selectedFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                isActive && { borderBottomColor: colors.primary },
              ]}
              onPress={() => setSelectedFilter(tab.key)}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: isActive ? colors.text : colors.textTertiary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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

              <Text style={[styles.playerMeta, { color: colors.textSecondary }]}>
                {player.isOpponent ? 'Rakip' : 'Takım Arkadaşı'} · %
                {Math.round((player.fairPlayRating / 5) * 100)} Fair-Play
              </Text>

              {player.evaluation?.badges && player.evaluation.badges.length > 0 && (
                <View style={styles.evalBadgesRow}>
                  {player.evaluation.badges.slice(0, 2).map((b, i) => (
                    <View
                      key={i}
                      style={[styles.evalBadgePill, { backgroundColor: `${colors.primary}18` }]}
                    >
                      <Text style={[styles.evalBadgeText, { color: colors.primary }]}>
                        {stripLeadingSymbols(b)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

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
                <Text style={styles.rateBtnText}>Puanla</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <PlayerEvaluationModal
        visible={Boolean(activePlayerToRate)}
        matchId={match.id}
        matchTitle={match.title}
        player={activePlayerToRate}
        onClose={() => setActivePlayerToRate(null)}
        onSubmit={async (data) => submitPlayerEvaluation(data)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  header: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  filterTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
    marginBottom: SPACING.md,
  },
  tabBtn: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  playersList: {
    gap: 8,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 11,
    borderRadius: RADIUS.md,
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
    fontWeight: '700',
  },
  playerMeta: {
    fontSize: 11,
  },
  evalBadgesRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 5,
  },
  evalBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  evalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rateBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  rateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  evaluatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evaluatedText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

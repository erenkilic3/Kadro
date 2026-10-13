import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { PitchLineup } from '../../components/PitchLineup';
import { PositionBadge } from '../../components/PositionBadge';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, FONT_SIZE, SPACING } from '../../constants/theme';
import { RosterSlot, PlayerPosition } from '../../types';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { matches, currentUser, joinMatchSlot, leaveMatch } = useApp();

  const match = matches.find((m) => m.id === id);

  if (!match) {
    return (
      <View style={styles.notFoundContainer}>
        <EmptyState
          icon="alert-circle-outline"
          title="Maç Bulunamadı"
          description="Aradığınız halı saha maçı kaldırılmış veya süresi dolmuş olabilir."
        />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isUserJoined = match.roster.some((s) => s.assignedPlayer?.id === currentUser.id);
  const vacantSlots = match.roster.filter((s) => !s.isFilled);
  const filledCount = match.roster.filter((s) => s.isFilled).length;

  const handleSlotSelect = (slot: RosterSlot) => {
    if (slot.isFilled) {
      if (slot.assignedPlayer?.id === currentUser.id) {
        handleLeave();
      } else {
        Alert.alert(
          'Dolu Mevki',
          `Bu mevkide ${slot.assignedPlayer?.name} yer alıyor.`
        );
      }
      return;
    }

    // Vacant slot selected
    Alert.alert(
      'Kadroya Katıl',
      `${slot.position} mevkisine katılmak istediğinizi onaylıyor musunuz? (Ücret: ₺${match.feePerPlayer})`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Onayla ve Katıl',
          onPress: async () => {
            const ok = await joinMatchSlot(match.id, slot.id);
            if (ok) {
              Alert.alert('⚽ Hoş Geldin!', `${slot.position} olarak kadroya eklendin.`);
            }
          },
        },
      ]
    );
  };

  const handleQuickJoin = () => {
    if (vacantSlots.length === 0) {
      Alert.alert('Kadro Dolu', 'Bu maçta tüm mevkiler dolmuştur.');
      return;
    }

    // Try to find matching user preferred position first, otherwise first available
    const preferredSlot = vacantSlots.find((s) => s.position === currentUser.position) || vacantSlots[0];

    Alert.alert(
      'Hızlı Katılım',
      `${preferredSlot.position} mevkisine katılmak üzeresiniz. Onaylıyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kadroya Katıl',
          onPress: async () => {
            await joinMatchSlot(match.id, preferredSlot.id);
            Alert.alert('⚽ Başarılı', 'Kadroya başarıyla dahil oldunuz!');
          },
        },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Kadrodan Ayrıl',
      'Bu maçtaki yerinizi boşaltmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            await leaveMatch(match.id);
            Alert.alert('Ayrıldınız', 'Mevkiniz boş bırakıldı.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner Card */}
      <View style={styles.heroCard}>
        <View style={styles.badgeRow}>
          <View style={styles.formatPill}>
            <Text style={styles.formatText}>{match.format}</Text>
          </View>
          <View style={styles.pitchPill}>
            <Text style={styles.pitchText}>{match.pitchType}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={styles.feeBadge}>
            <Text style={styles.feeNumber}>₺{match.feePerPlayer}</Text>
            <Text style={styles.feePer}>/kişi</Text>
          </View>
        </View>

        <Text style={styles.title}>{match.title}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar" size={16} color={COLORS.primaryLight} />
          <Text style={styles.metaText}>{match.date}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Ionicons name="time" size={16} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{match.time}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location" size={16} color={COLORS.danger} />
          <Text style={styles.metaText}>
            {match.venueName} ({match.address})
          </Text>
        </View>
      </View>

      {/* Organizer Info Box */}
      <View style={styles.organizerBox}>
        <View style={styles.orgAvatar}>
          <Ionicons name="person-circle" size={32} color={COLORS.accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.orgLabel}>Kadro Kaptanı / Organizatör</Text>
          <Text style={styles.orgName}>{match.organizerName}</Text>
        </View>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => Alert.alert('İletişim', `Organizatör Tel: ${match.organizerPhone}`)}
        >
          <Ionicons name="call" size={16} color={COLORS.black} />
          <Text style={styles.callBtnText}>Ara</Text>
        </TouchableOpacity>
      </View>

      {/* Missing Positions Banner */}
      {vacantSlots.length > 0 ? (
        <View style={styles.missingBanner}>
          <View style={styles.missingBannerLeft}>
            <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
            <Text style={styles.missingBannerTitle}>
              {vacantSlots.length} Oyuncu Aranıyor:
            </Text>
          </View>
          <View style={styles.posChips}>
            {match.missingPositions.map((p, i) => (
              <View key={`${p}_${i}`} style={{ marginLeft: 4 }}>
                <PositionBadge position={p} size="sm" />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={[styles.missingBanner, { borderColor: COLORS.success, backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={[styles.missingBannerTitle, { color: COLORS.success, marginLeft: 6 }]}>
            Kadro Tamamlandı! Maça Hazır.
          </Text>
        </View>
      )}

      {/* Tactical Pitch View Section */}
      <View style={styles.sectionHeaderRow}>
        <Ionicons name="football" size={18} color={COLORS.accent} />
        <Text style={styles.sectionTitle}>İnteraktif Saha Dizilimi</Text>
        <Text style={styles.sectionHint}>(Boş mevkiye dokunarak katıl)</Text>
      </View>

      <PitchLineup
        roster={match.roster}
        onSelectSlot={handleSlotSelect}
        currentUserId={currentUser.id}
      />

      {/* Roster Table Summary */}
      <View style={styles.rosterCard}>
        <View style={styles.rosterHeader}>
          <Text style={styles.rosterTitle}>Oyuncu Listesi</Text>
          <Text style={styles.rosterCount}>{filledCount}/{match.totalSlots} Dolu</Text>
        </View>

        {match.roster.slice(0, Math.ceil(match.totalSlots / 2)).map((slot, index) => (
          <View key={slot.id} style={styles.rosterRow}>
            <View style={styles.slotPos}>
              <PositionBadge position={slot.position} size="sm" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.slotName, !slot.isFilled && styles.slotVacantText]}>
                {slot.isFilled
                  ? slot.assignedPlayer?.name
                  : '— Boş Mevki (Oyuncu Bekleniyor)'}
              </Text>
            </View>
            {slot.isFilled ? (
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            ) : (
              <TouchableOpacity
                style={styles.miniJoinBtn}
                onPress={() => handleSlotSelect(slot)}
              >
                <Text style={styles.miniJoinText}>Katıl</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Notes / Rules */}
      {match.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesTitle}>Kaptan Notu & Kurallar</Text>
          <Text style={styles.notesBody}>{match.notes}</Text>
        </View>
      ) : null}

      {/* Sticky Bottom Action Button */}
      <View style={styles.bottomBar}>
        {isUserJoined ? (
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <Ionicons name="exit-outline" size={20} color={COLORS.danger} />
            <Text style={styles.leaveBtnText}>Kadrodan Ayrıl</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.joinBtn, vacantSlots.length === 0 && styles.joinBtnDisabled]}
            onPress={handleQuickJoin}
            disabled={vacantSlots.length === 0}
          >
            <Ionicons name="football" size={20} color={COLORS.black} />
            <Text style={styles.joinBtnText}>
              {vacantSlots.length > 0 ? 'Kadroya Hemen Katıl' : 'Kadro Tamamen Doldu'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: COLORS.black,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  formatPill: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  formatText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  pitchPill: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pitchText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  feeNumber: {
    color: COLORS.accent,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  feePer: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginLeft: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginLeft: 6,
    flex: 1,
  },
  metaDot: {
    color: COLORS.textTertiary,
    marginHorizontal: 8,
  },
  organizerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  orgAvatar: {},
  orgLabel: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  orgName: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  callBtnText: {
    color: COLORS.black,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  missingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  missingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  missingBannerTitle: {
    color: COLORS.warning,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  posChips: {
    flexDirection: 'row',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginLeft: 6,
  },
  sectionHint: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.xs,
    marginLeft: 6,
  },
  rosterCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginTop: SPACING.md,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 6,
  },
  rosterTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  rosterCount: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  slotPos: {
    width: 65,
  },
  slotName: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  slotVacantText: {
    color: COLORS.danger,
    fontStyle: 'italic',
  },
  miniJoinBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniJoinText: {
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '800',
  },
  notesBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  notesTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginBottom: 4,
  },
  notesBody: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
  bottomBar: {
    marginTop: SPACING.xl,
  },
  joinBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  joinBtnDisabled: {
    backgroundColor: COLORS.surfaceBorder,
    opacity: 0.6,
  },
  joinBtnText: {
    color: COLORS.black,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  leaveBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  leaveBtnText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
});

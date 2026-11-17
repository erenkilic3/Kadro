import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { PositionBadge } from './PositionBadge';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';
import { JoinRequest } from '../types';
import { getInitials } from '../utils/formatters';

interface CaptainRequestsSectionProps {
  requests: JoinRequest[];
  isDemoPreview?: boolean;
  onApprove: (requestId: string) => Promise<boolean>;
  onReject: (requestId: string) => Promise<boolean>;
}

export const CaptainRequestsSection: React.FC<CaptainRequestsSectionProps> = ({
  requests,
  isDemoPreview = false,
  onApprove,
  onReject,
}) => {
  const { colors } = useTheme();

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const historyRequests = requests.filter((r) => r.status !== 'PENDING');

  const handleApprove = async (req: JoinRequest) => {
    const ok = await onApprove(req.id);
    if (ok) {
      Alert.alert(
        'Onaylandı',
        `${req.requesterName}, ${req.position} mevkisi için takıma eklendi.`
      );
    } else {
      Alert.alert(
        'Onaylanamadı',
        'Bu mevki için uygun boş yer kalmamış olabilir.'
      );
    }
  };

  const handleReject = async (req: JoinRequest) => {
    const ok = await onReject(req.id);
    if (ok) {
      Alert.alert('Reddedildi', `${req.requesterName} oyuncusunun isteği reddedildi.`);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isDemoPreview ? 'Kaptan Onay Paneli (Demo)' : 'Gelen Katılma İstekleri'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {pendingRequests.length > 0
              ? `${pendingRequests.length} oyuncu kaptan onayı bekliyor`
              : 'Bekleyen katılma isteği bulunmuyor'}
          </Text>
        </View>

        {pendingRequests.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: `${colors.warning}20` }]}>
            <Text style={[styles.countText, { color: colors.warning }]}>
              {pendingRequests.length} bekliyor
            </Text>
          </View>
        )}
      </View>

      {pendingRequests.length > 0 && (
        <View style={styles.list}>
          {pendingRequests.map((req) => (
            <View
              key={req.id}
              style={[styles.requestCard, { backgroundColor: colors.surfaceLight }]}
            >
              <View style={styles.requesterRow}>
                <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.avatarText, { color: colors.text }]}>
                    {getInitials(req.requesterName)}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.nameLine}>
                    <Text style={[styles.requesterName, { color: colors.text }]} numberOfLines={1}>
                      {req.requesterName}
                    </Text>
                    <PositionBadge position={req.position} size="sm" />
                  </View>
                  <Text style={[styles.statsLine, { color: colors.textSecondary }]}>
                    Yetenek {req.requesterRating.toFixed(1)} · Fair-Play %
                    {Math.round(((req.requesterFairPlay || 4.9) / 5) * 100)}
                  </Text>
                </View>
              </View>

              {req.message ? (
                <Text style={[styles.messageText, { color: colors.textSecondary }]}>
                  {`"${req.message}"`}
                </Text>
              ) : null}

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.rejectBtn, { backgroundColor: `${colors.danger}15` }]}
                  onPress={() => handleReject(req)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.rejectText, { color: colors.danger }]}>Reddet</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.approveBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleApprove(req)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.approveText}>Onayla ve Takıma Al</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {historyRequests.length > 0 && (
        <View style={[styles.historySection, { borderTopColor: colors.surfaceBorder }]}>
          <Text style={[styles.historyHeading, { color: colors.textTertiary }]}>
            Sonuçlanan Başvurular
          </Text>
          {historyRequests.map((req) => {
            const approved = req.status === 'APPROVED';
            return (
              <View key={req.id} style={styles.historyRow}>
                <Text style={[styles.historyName, { color: colors.text }]} numberOfLines={1}>
                  {req.requesterName} ({req.position})
                </Text>
                <Text
                  style={[
                    styles.historyStatus,
                    { color: approved ? colors.success : colors.danger },
                  ]}
                >
                  {approved ? 'Onaylandı' : 'Reddedildi'}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    gap: 10,
    marginTop: SPACING.md,
  },
  requestCard: {
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
  },
  requesterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requesterName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    flexShrink: 1,
  },
  statsLine: {
    fontSize: 11,
    marginTop: 2,
  },
  messageText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 9,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  rejectBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
  },
  rejectText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
  },
  approveText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  historySection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm + 2,
    gap: 6,
  },
  historyHeading: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  historyStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
});

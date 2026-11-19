import React, { useMemo } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../../components/EmptyState';
import { FONT_SIZE, NUMERIC_STYLE, RADIUS, SPACING } from '../../constants/theme';
import { getInitials } from '../../utils/formatters';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    venues,
    matches,
    currentUser,
    getVenueEvaluationsByVenue,
    deleteVenueEvaluation,
  } = useApp();
  const { colors } = useTheme();

  const venue = useMemo(() => venues.find((v) => v.id === id), [venues, id]);

  const reviews = useMemo(
    () => (venue ? getVenueEvaluationsByVenue(venue.id) : []),
    [venue, getVenueEvaluationsByVenue]
  );

  const venueMatches = useMemo(() => {
    if (!venue) return [];
    return matches.filter(
      (m) =>
        m.venueId === venue.id ||
        (m.venueName.trim().toLowerCase() === venue.name.trim().toLowerCase() &&
          m.district.trim().toLowerCase() === venue.district.trim().toLowerCase())
    );
  }, [matches, venue]);

  if (!venue) {
    return (
      <View style={[styles.centerWrap, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="location-outline"
          title="Tesis bulunamadı"
          description="Aradığınız halı saha tesisi sistemde bulunamadı."
          buttonText="Geri Dön"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const categories = [
    { label: 'Zemin Kalitesi', score: venue.turfRating },
    { label: 'Işıklandırma & Görüş', score: venue.lightingRating },
    { label: 'Soyunma Odası & Duş', score: venue.lockerRoomRating },
    { label: 'Tesis İşletmesi', score: venue.organizationRating },
  ];

  const handleDeleteReview = (reviewId: string) => {
    const run = async () => {
      try {
        await deleteVenueEvaluation(reviewId);
      } catch (err) {
        Alert.alert('Hata', err instanceof Error ? err.message : 'Yorum silinemedi.');
      }
    };

    if (Platform.OS === 'web') {
      void run();
      return;
    }
    Alert.alert('Değerlendirmeyi Sil', 'Tesis yorumunuzu kaldırmak istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void run() },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Hero Summary Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={styles.heroTopRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={styles.badgesRow}>
              <View style={[styles.pitchBadge, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.pitchBadgeText, { color: colors.textSecondary }]}>
                  {venue.pitchType}
                </Text>
              </View>
              <Text style={[styles.locationMeta, { color: colors.textTertiary }]}>
                {venue.district}, {venue.city}
              </Text>
            </View>
            <Text style={[styles.venueName, { color: colors.text }]}>{venue.name}</Text>
            {venue.address ? (
              <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                {venue.address}
              </Text>
            ) : null}
          </View>

          <View style={[styles.scoreBox, { backgroundColor: colors.surfaceLight }]}>
            <View style={styles.scoreStarRow}>
              <Ionicons name="star" size={16} color={colors.warning} />
              <Text style={[styles.scoreBig, { color: colors.text }]}>
                {venue.evaluationsCount > 0 ? venue.overallRating.toFixed(1) : '-'}
              </Text>
            </View>
            <Text style={[styles.scoreCount, { color: colors.textTertiary }]}>
              {venue.evaluationsCount} yorum
            </Text>
          </View>
        </View>

        {/* Sub-Rating Bars */}
        <View style={[styles.barsWrap, { borderTopColor: colors.surfaceBorder }]}>
          {categories.map((cat) => {
            const pct = venue.evaluationsCount > 0 ? (cat.score / 5) * 100 : 0;
            return (
              <View key={cat.label} style={styles.barRow}>
                <View style={styles.barHeader}>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                    {cat.label}
                  </Text>
                  <Text style={[styles.barScore, { color: colors.text }]}>
                    {venue.evaluationsCount > 0 ? cat.score.toFixed(1) : '—'}
                  </Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: colors.surfaceLight }]}>
                  <View
                    style={[
                      styles.barFill,
                      { backgroundColor: colors.primary, width: `${pct}%` },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {venue.amenities.length > 0 && (
          <View style={[styles.amenitiesWrap, { borderTopColor: colors.surfaceBorder }]}>
            <Text style={[styles.sectionKicker, { color: colors.textTertiary }]}>
              ÖNE ÇIKAN ÖZELLİKLER
            </Text>
            <View style={styles.chipsRow}>
              {venue.amenities.map((tag) => (
                <View
                  key={tag}
                  style={[styles.amenityPill, { backgroundColor: `${colors.primary}14` }]}
                >
                  <Text style={[styles.amenityText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Matches Played / Scheduled Here */}
      {venueMatches.length > 0 && (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Bu Tesisteki Maçlar ({venueMatches.length})
          </Text>
          {venueMatches.slice(0, 5).map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.matchRow, { borderTopColor: colors.surfaceBorder }]}
              onPress={() => router.push(`/match/${m.id}`)}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.matchTitle, { color: colors.text }]} numberOfLines={1}>
                  {m.title}
                </Text>
                <Text style={[styles.matchMeta, { color: colors.textSecondary }]}>
                  {m.date} · {m.time} · {m.format}
                </Text>
              </View>
              <View
                style={[
                  styles.matchStatusPill,
                  {
                    backgroundColor: m.isCompleted
                      ? colors.surfaceLight
                      : `${colors.primary}15`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.matchStatusText,
                    { color: m.isCompleted ? colors.textSecondary : colors.primary },
                  ]}
                >
                  {m.isCompleted ? 'Tamamlandı' : 'Aktif'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Player Reviews */}
      <Text style={[styles.reviewsHeading, { color: colors.text }]}>
        Oyuncu Değerlendirmeleri ({reviews.length})
      </Text>

      {reviews.length > 0 ? (
        reviews.map((rev) => {
          const isOwn = rev.evaluatorId === currentUser.id;
          return (
            <View
              key={rev.id}
              style={[
                styles.reviewCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <View style={styles.reviewHeader}>
                <View style={[styles.avatarBox, { backgroundColor: colors.surfaceLight }]}>
                  <Text style={[styles.avatarInitials, { color: colors.text }]}>
                    {getInitials(rev.evaluatorName)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewerName, { color: colors.text }]}>
                    {rev.evaluatorName}
                  </Text>
                  <Text style={[styles.reviewDate, { color: colors.textTertiary }]}>
                    {new Date(rev.createdAt).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
                <View style={[styles.reviewScoreBadge, { backgroundColor: `${colors.warning}1A` }]}>
                  <Ionicons name="star" size={12} color={colors.warning} />
                  <Text style={[styles.reviewScoreText, { color: colors.text }]}>
                    {rev.overallRating.toFixed(1)}
                  </Text>
                </View>
                {isOwn && (
                  <TouchableOpacity
                    onPress={() => handleDeleteReview(rev.id)}
                    hitSlop={14}
                    style={{ marginLeft: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.subScoresRow, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.subScoreChip, { color: colors.textSecondary }]}>
                  Zemin {rev.turfRating}/5
                </Text>
                <Text style={[styles.subScoreChip, { color: colors.textSecondary }]}>
                  Işık {rev.lightingRating}/5
                </Text>
                <Text style={[styles.subScoreChip, { color: colors.textSecondary }]}>
                  Duş {rev.lockerRoomRating}/5
                </Text>
                <Text style={[styles.subScoreChip, { color: colors.textSecondary }]}>
                  İşletme {rev.organizationRating}/5
                </Text>
              </View>

              {rev.highlights.length > 0 && (
                <View style={styles.chipsRow}>
                  {rev.highlights.map((h) => (
                    <View
                      key={h}
                      style={[styles.reviewTagPill, { backgroundColor: colors.surfaceLight }]}
                    >
                      <Text style={[styles.reviewTagText, { color: colors.textSecondary }]}>
                        {h}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {rev.comment ? (
                <Text style={[styles.commentBody, { color: colors.textSecondary }]}>
                  {`"${rev.comment}"`}
                </Text>
              ) : null}
            </View>
          );
        })
      ) : (
        <EmptyState
          icon="star-outline"
          title="Henüz tesis değerlendirmesi yok"
          description="Bu sahada tamamlanan bir maçta oynayan oyuncular maç detayından tesisi puanlayabilir."
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pitchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  pitchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  locationMeta: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  venueName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  addressText: {
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
    lineHeight: 18,
  },
  scoreBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    minWidth: 74,
  },
  scoreStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreBig: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
  scoreCount: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
    ...NUMERIC_STYLE,
  },
  barsWrap: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  barRow: {
    gap: 4,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  barScore: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  amenitiesWrap: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
  },
  amenityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: 8,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  matchTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  matchMeta: {
    fontSize: 11.5,
    marginTop: 2,
  },
  matchStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  matchStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reviewsHeading: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  reviewCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: '800',
  },
  reviewerName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: 11,
    marginTop: 1,
  },
  reviewScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  reviewScoreText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
  subScoresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.xs,
  },
  subScoreChip: {
    fontSize: 11,
    fontWeight: '600',
    ...NUMERIC_STYLE,
  },
  reviewTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  reviewTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  commentBody: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
});
